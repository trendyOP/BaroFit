/**
 * app/camera/index.tsx
 * 
 * 통합 카메라 화면 (메인 컨트롤러)
 */
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CodeType, CameraRuntimeError, PhotoFile, useCameraDevices } from 'react-native-vision-camera';
import { foodTypes } from 'fitlyever-ts-rest-contract';

// UI 컴포넌트
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';

// 모드별 컴포넌트
import PhotoCameraMode from './modes/PhotoCameraMode';
import ScannerCameraMode from './modes/ScannerCameraMode';
import PreviewMode from './modes/PreviewMode';
import { PoseDetectionMode } from './modes/PoseDetectionMode';
import { SidePoseDetectionMode } from './modes/SidePoseDetectionMode';
import BarcodeResultModal from './views/BarcodeResultModal';

// 커스텀 훅
import useCameraPermission from './hooks/use-camera-permission';

// 타입
import { CameraMode, CameraPageProps } from './types';

// ⭐️ [추가] Zustand 스토어를 가져옵니다.
import { useFoodBottomSheetStore } from '~/app/(app)/(bottom-sheet)/AddFoodQuickBottomSheet/store/foodBottomSheetStore';

export default function CameraPage({
  initialMode = 'scanner',
  onCodeScanned,
  onFoodSelected,
  supportedCodeTypes = ['ean-13', 'ean-8'] as CodeType[],
  showControls = true,
  showFlipCameraButton = true,
  showFlashButton = true,
  showModeToggle = true,
  initialCameraPosition = 'back',
  enableFlash = true,
  onCapture,
  onError,
  onModeChange,
  containerStyle,
  captureButtonSize = 78,
  enablePhotoCapture = true,
}: CameraPageProps = {}) {
  // 카메라 상태 관리
  const [cameraMode, setCameraMode] = useState<CameraMode>(initialMode);
  const [capturedMedia, setCapturedMedia] = useState<PhotoFile | null>(null);
  
  const { cameraReturnMode, clearCameraReturnMode } = useFoodBottomSheetStore();
  
  // 바코드 스캔 결과 모달 관련 상태
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // 권한 관리
  const { isGranted, requestPermission } = useCameraPermission(true);
  
  // 카메라 모드 변경 디바운싱을 위한 ref
  const lastModeChangeTimeRef = useRef<number>(0);
  const MODE_CHANGE_DEBOUNCE_MS = 500; // 500ms 디바운싱
  
  // initialMode가 변경될 때 cameraMode 업데이트
  useEffect(() => {
    setCameraMode(initialMode);
  }, [initialMode]);
  
  // 모드 변경 핸들러
  const handleModeChange = useCallback((mode: CameraMode) => {
    const now = Date.now();
    
    // 디바운싱: 마지막 모드 변경으로부터 500ms 이내의 변경은 무시
    if (now - lastModeChangeTimeRef.current < MODE_CHANGE_DEBOUNCE_MS) {
      console.log(`카메라 모드 변경 무시 (디바운싱): ${mode}`);
      return;
    }
    
    // 현재 모드와 동일한 모드로 변경 시도하는 경우 무시
    if (cameraMode === mode) {
      return;
    }
    
    lastModeChangeTimeRef.current = now;
    console.log(`Changing camera mode to: ${mode}`);
    setCameraMode(mode);
    
    // 외부로 모드 변경 알림
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [cameraMode, onModeChange]);
  
  // ⭐️ [개선] 스토어의 `cameraReturnMode`를 감지하여 상태를 복원하는 useEffect
  useEffect(() => {
    if (cameraReturnMode) {
      console.log(`CameraPage: 스토어의 요청에 따라 '${cameraReturnMode}' 모드로 복원합니다.`);
      
      // 지정된 모드로 복원
      handleModeChange(cameraReturnMode);
      
      // 캡처된 미디어 초기화
      setCapturedMedia(null);
      
      // 신호 초기화하여 반복 실행 방지
      clearCameraReturnMode();
    }
  }, [cameraReturnMode, handleModeChange, clearCameraReturnMode]);
  
  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      // 상태 정리
      setCapturedMedia(null);
      setScannedCode(null);
      setIsModalVisible(false);
    };
  }, []);
  
  // 바코드 스캔 핸들러
  const handleCodeScanned = useCallback((code: string) => {
    console.log(`바코드 스캔됨:`, code);
    setScannedCode(code);
    
    // 외부 핸들러가 있으면 호출
    if (onCodeScanned) {
      onCodeScanned(code);
    }
    
    // 결과 모달 표시
    setIsModalVisible(true);
    console.log('바코드 결과 모달 표시, 스캔 일시 중지');
  }, [onCodeScanned]);
  
  // 바코드 모달 닫기 핸들러
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    console.log('바코드 결과 모달 닫힘, 스캔 재개');
    // 스캔 상태 초기화하여 다시 스캔 가능하게 함
    setScannedCode(null);
  }, []);
  
  // 음식 선택 핸들러
  const handleFoodSelected = useCallback((food: foodTypes.Food) => {
    console.log('음식 선택됨:', food);
    
    // 외부 핸들러가 있으면 호출
    if (onFoodSelected) {
      onFoodSelected(food);
    }
    
    // 모달 닫기
    handleCloseModal();
  }, [onFoodSelected, handleCloseModal]);
  
  // 미디어 캡처 핸들러
  const handleMediaCaptured = useCallback((photo: PhotoFile) => {
    console.log(`Photo captured!`);
    
    // 외부 캡처 핸들러 호출
    if (onCapture) {
      onCapture(photo);
      // AI 분석용 촬영인 경우 preview 모드로 전환하지 않음
      // AI 분석은 별도 모달에서 처리됨
      return;
    }
    
    // 외부 핸들러가 없는 경우에만 기본 preview 모드로 전환
    setCapturedMedia(photo);
    setCameraMode('preview');
  }, [onCapture]);
  

  
  // 미리보기 종료 핸들러
  const handleClosePreview = useCallback(() => {
    console.log('Closing preview...');
    // 상태 초기화
    setCapturedMedia(null);
    // 카메라 모드로 복귀
    setCameraMode('photo');
  }, []);
  
  // 에러 핸들러
  const handleError = useCallback((error: CameraRuntimeError) => {
    console.error('Camera Error:', error);
    
    // 외부 에러 핸들러 호출
    if (onError) {
      onError(error);
    }
  }, [onError]);
  
  // 권한이 없는 경우
  if (!isGranted) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4" style={containerStyle}>
        <StatusBar style="light" />
        <Text className="mb-4 text-center text-base">
          카메라를 사용하려면 권한이 필요합니다.
        </Text>
        <Button variant="default" onPress={requestPermission}>
          <Text className="text-primary-foreground">권한 요청</Text>
        </Button>
      </View>
    );
  }
  
  // 사진 촬영 모드
  if (cameraMode === 'photo') {
    return (
      <>
        <PhotoCameraMode
          onCapture={handleMediaCaptured}
          onError={handleError}
          onModeChange={handleModeChange}
          showControls={showControls}
          showFlipCameraButton={showFlipCameraButton}
          showFlashButton={showFlashButton}
          showModeToggle={showModeToggle}
          enableFlash={enableFlash}
          containerStyle={containerStyle}
          captureButtonSize={captureButtonSize}
          enablePhotoCapture={enablePhotoCapture}
        />
      </>
    );
  }
  
  // 바코드 스캔 모드
  if (cameraMode === 'scanner') {
    return (
      <>
        <ScannerCameraMode
          onCodeScanned={handleCodeScanned}
          onFoodSelected={handleFoodSelected}
          supportedCodeTypes={supportedCodeTypes}
          onModeChange={handleModeChange}
          showControls={showControls}
          showFlipCameraButton={showFlipCameraButton}
          showFlashButton={showFlashButton}
          showModeToggle={showModeToggle}
          enableFlash={enableFlash}
          containerStyle={containerStyle}
          isModalVisible={isModalVisible}
        />
        
        {/* 바코드 결과 모달 */}
        <BarcodeResultModal
          isVisible={isModalVisible}
          barcode={scannedCode}
          onClose={handleCloseModal}
          onSelectFood={handleFoodSelected}
        />
      </>
    );
  }
  
  // 미디어 미리보기 모드
  if (cameraMode === 'preview' && capturedMedia) {
    return (
      <PreviewMode
        capturedMedia={capturedMedia}
        onClose={handleClosePreview}
        onModeChange={handleModeChange}
        showControls={showControls}
        containerStyle={containerStyle}
      />
    );
  }
  
  // 포즈 감지 모드
  if (cameraMode === 'pose') {
    return (
      <PoseDetectionMode />
    );
  }
  
  // 측면 포즈 감지 모드
  if (cameraMode === 'side-pose') {
    return (
      <SidePoseDetectionMode />
    );
  }
  
  // 기본 반환
  return (
    <View className="flex-1 items-center justify-center bg-background p-4" style={containerStyle}>
      <Text className="text-center text-base font-medium">
        알 수 없는 카메라 모드입니다.
      </Text>
    </View>
  );
}