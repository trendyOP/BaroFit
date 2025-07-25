/**
 * app/camera/modes/ScannerCameraMode.tsx
 * 
 * 바코드 스캐너 모드 컴포넌트
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraRuntimeError, useCodeScanner, CameraDevice, CodeType } from 'react-native-vision-camera';
import Reanimated, { useAnimatedProps } from 'react-native-reanimated';

// 커스텀 훅
import useIsForeground from '../hooks/use-is-foreground';
import useCameraPermission from '../hooks/use-camera-permission';
import useCameraFormat from '../hooks/use-camera-format';
import useZoomControl from '../hooks/use-zoom-control';

// 에러 핸들러
import { handleCameraRuntimeError } from '../utils/error-handler';

// 컴포넌트
import { TopControls, RightControls, ScannerGuideOverlay, ScanResultDisplay } from '../views/camera-controls';

// 타입
import { ScannerModeProps } from '../types';

// 상수
import { MAX_ZOOM_FACTOR } from '../utils/constants';

// 스캔 안정화를 위한 임계값
const SCAN_CONFIRMATION_THRESHOLD = 4; // 4번 연속 동일 코드 감지 시 확정

// 카메라 컴포넌트를 애니메이션 가능하게 변환
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

export default function ScannerCameraMode({
  onCodeScanned,
  onFoodSelected,
  supportedCodeTypes = ['ean-13', 'ean-8'] as CodeType[],
  onModeChange,
  showControls = true,
  showFlipCameraButton = true,
  showFlashButton = true,
  showModeToggle = true,
  enableFlash = true,
  containerStyle,
  isModalVisible = false,
}: ScannerModeProps) {
  const camera = useRef<Camera>(null);
  
  // 앱 상태 관련 훅 사용
  const isForeground = useIsForeground();
  
  // 카메라 장치 관련
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  
  // 스캔 결과 및 안정화 관련 상태
  const [scannedCode, setScannedCode] = useState<string | null>(null); // 최종 UI 표시용 (필요시)
  const [lastConfirmedScannedValue, setLastConfirmedScannedValue] = useState<string | null>(null);
  const [potentialCode, setPotentialCode] = useState<string | null>(null);
  const [potentialCodeType, setPotentialCodeType] = useState<CodeType | null>(null);
  const [detectionCount, setDetectionCount] = useState(0);
  
  // 카메라 권한 확인 및 장치 목록 얻기
  const { devices } = useCameraPermission();
  const device = devices.find((d: CameraDevice) => d.position === cameraPosition) || devices[0];
  const { zoom } = useZoomControl(device, MAX_ZOOM_FACTOR);
  const format = useCameraFormat(device, [
    { videoAspectRatio: 16/9 },
    { videoResolution: 'max' },
  ]);
  
  // 모달이 닫힐 때 스캔 관련 상태 초기화
  useEffect(() => {
    if (!isModalVisible) {
      // 모달이 닫혔을 때 (isModalVisible이 false가 되었을 때)
      // 마지막으로 확정된 스캔 값을 초기화하여 동일한 코드도 다시 스캔될 수 있도록 함.
      setLastConfirmedScannedValue(null);
      
      // 다음 즉시 스캔을 위해 현재 감지 중인 후보군도 초기화합니다.
      setPotentialCode(null);
      setPotentialCodeType(null);
      setDetectionCount(0);
      
      // console.log('모달 닫힘: 스캔 상태 (lastConfirmedScannedValue, potentialCode) 초기화됨');
    }
  }, [isModalVisible]); // isModalVisible 값이 변경될 때마다 이 useEffect 실행
  
  // 바코드 스캐너 설정
  const codeScanner = useCodeScanner({
    codeTypes: supportedCodeTypes,
    onCodeScanned: (codes) => {
      if (isModalVisible) return;

      let currentDetectedValue: string | null = null;
      let currentDetectedType: CodeType | null = null;

      // --- 바코드 스캔 우선순위 조정 ---
      // 1. 한국 EAN-13 (880으로 시작) 우선 스캔
      if (supportedCodeTypes.includes('ean-13')) {
        const koreanEan13 = codes.find(code => 
          code.value && /^880\d{10}$/.test(code.value) && code.type === 'ean-13'
        );
        if (koreanEan13 && koreanEan13.value) {
          currentDetectedValue = koreanEan13.value;
          currentDetectedType = 'ean-13';
          // EAN-13 디버깅: 라이브러리가 반환하는 원본 값 로깅
          console.log('EAN-13 원본 스캔 값 (한국):', koreanEan13.value, '타입:', koreanEan13.type);
        }
      }

      // 2. 한국 EAN-8 (880으로 시작) 우선 스캔 (1순위에서 못 찾았을 경우)
      if (!currentDetectedValue && supportedCodeTypes.includes('ean-8')) {
        const koreanEan8 = codes.find(code => 
          code.value && /^880\d{5}$/.test(code.value) && code.type === 'ean-8'
        );
        if (koreanEan8 && koreanEan8.value) {
          currentDetectedValue = koreanEan8.value;
          currentDetectedType = 'ean-8';
          // console.log('스캔됨 (2순위: 한국 EAN-8):', koreanEan8.value);
          // EAN-8 디버깅: 라이브러리가 반환하는 원본 값 로깅
          console.log('EAN-8 원본 스캔 값 (한국):', koreanEan8.value, '타입:', koreanEan8.type);
        }
      }

      // 3. 기타 EAN-13 스캔 (1, 2순위에서 못 찾았을 경우)
      if (!currentDetectedValue && supportedCodeTypes.includes('ean-13')) {
        const otherEan13 = codes.find(code => 
          code.value && /^\d{13}$/.test(code.value) && code.type === 'ean-13'
        );
        if (otherEan13 && otherEan13.value) {
          currentDetectedValue = otherEan13.value;
          currentDetectedType = 'ean-13';
          // EAN-13 디버깅: 라이브러리가 반환하는 원본 값 로깅
          console.log('EAN-13 원본 스캔 값 (기타):', otherEan13.value, '타입:', otherEan13.type);
        }
      }

      // 4. 기타 EAN-8 스캔 (1, 2, 3순위에서 못 찾았을 경우)
      if (!currentDetectedValue && supportedCodeTypes.includes('ean-8')) {
        const otherEan8 = codes.find(code => 
          code.value && /^\d{8}$/.test(code.value) && code.type === 'ean-8'
        );
        if (otherEan8 && otherEan8.value) {
          currentDetectedValue = otherEan8.value;
          currentDetectedType = 'ean-8';
          // console.log('스캔됨 (4순위: 기타 EAN-8):', otherEan8.value);
          // EAN-8 디버깅: 라이브러리가 반환하는 원본 값 로깅
          console.log('EAN-8 원본 스캔 값 (기타):', otherEan8.value, '타입:', otherEan8.type);
        }
      }
      
      // 유효한 코드가 감지된 경우 스캔 안정화 로직 진행
      if (currentDetectedValue) {
        if (currentDetectedValue === potentialCode) {
          setDetectionCount(prevCount => prevCount + 1);
        } else {
          setPotentialCode(currentDetectedValue);
          setPotentialCodeType(currentDetectedType);
          setDetectionCount(1);
        }

        if (detectionCount >= SCAN_CONFIRMATION_THRESHOLD -1 &&
            potentialCode && 
            potentialCode !== lastConfirmedScannedValue) {
          
          setScannedCode(potentialCode);
          console.log(`확정된 바코드(${potentialCodeType || 'N/A'}): ${potentialCode}`);
          
          if (onCodeScanned) {
            onCodeScanned(potentialCode);
          }
          setLastConfirmedScannedValue(potentialCode);
          
          setPotentialCode(null);
          setPotentialCodeType(null);
          setDetectionCount(0);
        }
      } else {
        // 유효한 코드가 없으면 이전 후보군 초기화하지 않음 (짧은 가려짐 대응)
      }
    }
  });
  
  // 카메라 애니메이션 속성
  const cameraAnimatedProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }));
  
  // 에러 핸들러
  const handleError = useCallback((error: CameraRuntimeError) => {
    console.error('Camera Error:', error);
    
    // 에러 핸들러 사용
    handleCameraRuntimeError(error);
  }, []);
  
  // 카메라 전환 핸들러
  const onFlipCameraPressed = useCallback(() => {
    if (cameraPosition === 'back') {
      setFlash('off');
      setCameraPosition('front');
    } else {
      setCameraPosition('back');
    }
  }, [cameraPosition]);
  
  // 플래시 전환 핸들러
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'));
  }, []);
  
  // 장치가 없는 경우
  if (!device) {
    return null;
  }
  
  return (
    <View className="flex-1 bg-black" style={containerStyle}>
      <StatusBar style="light" />
      
      <ReanimatedCamera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isForeground && !isModalVisible}
        onError={handleError}
        codeScanner={codeScanner}
        animatedProps={cameraAnimatedProps}
        // 스캐너 모드에서도 플래시 활성화
        // @ts-ignore - 타입 정의 문제이지만 실제로는 동작함
        torch={flash}
      />
      
      {/* 스캔 영역 가이드 */}
      <ScannerGuideOverlay />
      
      {/* 상단 컨트롤 */}
      {showControls && (
        <TopControls 
          currentMode="scanner"
          onModeChange={onModeChange}
          showModeToggle={showModeToggle}
        />
      )}
      
      {/* 우측 컨트롤 */}
      {showControls && (
        <RightControls 
          showFlipCameraButton={showFlipCameraButton}
          showFlashButton={showFlashButton}
          hasFlash={device.hasFlash}
          enableFlash={enableFlash}
          flash={flash}
          onFlipCamera={onFlipCameraPressed}
          onFlashToggle={onFlashPressed}
          cameraPosition={cameraPosition}
        />
      )}
      
      {/* 스캔 결과 간단 표시 (모달에서 보여주므로 숨김 처리) */}
      {!onCodeScanned && !isModalVisible && scannedCode && (
        <ScanResultDisplay scannedCode={scannedCode} />
      )}
    </View>
  );
} 