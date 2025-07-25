/**
 * app/camera/modes/PhotoCameraMode.tsx
 * 
 * 사진 촬영 모드 컴포넌트
 */
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraRuntimeError, PhotoFile, CameraDevice } from 'react-native-vision-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedProps, Extrapolate, interpolate, runOnJS, useDerivedValue } from 'react-native-reanimated';

// 커스텀 훅
import useIsForeground from '../hooks/use-is-foreground';
import useCameraPermission from '../hooks/use-camera-permission';
import useCameraFormat from '../hooks/use-camera-format';
import useZoomControl from '../hooks/use-zoom-control';

// 에러 핸들러
import { handleCameraRuntimeError } from '../utils/error-handler';

// 컴포넌트
import CaptureButton from '../views/capture-button';
import { TopControls, RightControls } from '../views/camera-controls';

// 타입
import { PhotoModeProps } from '../types';

// 상수
import { MAX_ZOOM_FACTOR, SCALE_FULL_ZOOM } from '../utils/constants';

// 유틸리티
import { calculateFocus } from '../utils/camera-utils';

// 카메라 컴포넌트를 애니메이션 가능하게 변환
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

export default function PhotoCameraMode({
  onCapture,
  onError,
  onModeChange,
  showControls = true,
  showFlipCameraButton = true,
  showFlashButton = true,
  showModeToggle = true,
  enableFlash = true,
  containerStyle,
  captureButtonSize = 78,
  enablePhotoCapture = true,
}: PhotoModeProps) {
  const camera = useRef<Camera>(null);
  
  // 앱 상태 관련 훅 사용
  const isForeground = useIsForeground();
  
  // 카메라 장치 관련
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  
  // 카메라 권한 확인 및 장치 목록 얻기
  const { devices } = useCameraPermission();
  
  // 현재 사용할 장치 결정 (최적의 카메라 자동 선택)
  const device = devices.find((d: CameraDevice) => d.position === cameraPosition) || devices[0];
  
  // 줌 제어 훅 사용
  const { 
    zoom, 
    minZoom, 
    maxZoom
  } = useZoomControl(device, MAX_ZOOM_FACTOR);
  
  // 카메라 포맷 선택 (4:3 화면비, 적절한 해상도)
  const format = useCameraFormat(device, [
    { videoAspectRatio: 16/9 },
    { videoResolution: 'high' },
    { photoAspectRatio: 4/3 },
    { photoResolution: 'high' }, // 'max' 대신 'high' 사용하여 해상도 조정
  ]);
  
  // 컴포넌트 렌더링 시 사용할 수 있도록 파생 값 생성
  const currentZoom = useDerivedValue(() => zoom.value, [zoom]);
  
  // 카메라 애니메이션 속성
  const cameraAnimatedProps = useAnimatedProps(() => ({
    zoom: zoom.value,
  }));
  
  // 카메라 초기화 완료 핸들러
  const onInitialized = useCallback(() => {
    console.log('Camera initialized!');
    setIsCameraInitialized(true);
  }, []);
  
  // 에러 핸들러
  const handleError = useCallback((error: CameraRuntimeError) => {
    console.error('Camera Error:', error);
    
    // 에러 핸들러 사용
    handleCameraRuntimeError(error);
    
    // 외부 에러 핸들러 호출
    if (onError) {
      onError(error);
    }
  }, [onError]);
  
  // 미디어 캡처 핸들러
  const handleMediaCaptured = useCallback((photo: PhotoFile) => {
    console.log('Photo captured successfully');
    
    // 외부 캡처 핸들러 호출
    if (onCapture) {
      onCapture(photo);
    }
  }, [onCapture]);
  
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
  
  // 탭 포커스 핸들러
  const onFocus = useCallback(async (x: number, y: number) => {
    if (!camera.current || !device?.supportsFocus) return;
    await camera.current.focus({ x, y });
  }, [device?.supportsFocus]);
  
  // 제스처 설정
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      'worklet';
      // 현재 줌 값을 기준점으로 설정
    })
    .onUpdate((event) => {
      'worklet';
      if (!device) return;
      
      // 로그 스케일로 변환하여 자연스러운 줌 효과
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolate.CLAMP
      );
      
      // currentZoom.value 대신 함수로 새 값 계산
      const newZoom = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, currentZoom.value, maxZoom],
        Extrapolate.CLAMP
      );
      
      zoom.value = newZoom;
    });
  
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      runOnJS(onFocus)(event.x, event.y);
    });
  
  const gesture = Gesture.Simultaneous(pinchGesture, tapGesture);

  // 장치가 없는 경우
  if (!device) {
    return null;
  }
  
  return (
    <View className="flex-1 bg-black" style={containerStyle}>
      <StatusBar style="light" />
      
      <GestureDetector gesture={gesture}>
        <ReanimatedCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isForeground}
          onInitialized={onInitialized}
          onError={handleError}
          format={format}
          photo={enablePhotoCapture}
          animatedProps={cameraAnimatedProps}
          enableZoomGesture={false}
          // @ts-ignore - 타입 정의 문제이지만 실제로는 동작함
          torch={flash}
        />
      </GestureDetector>
      
      {/* 상단 컨트롤 */}
      {showControls && (
        <TopControls 
          currentMode="photo"
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
      
      {/* 촬영 버튼 */}
      {showControls && enablePhotoCapture && (
        <View className="absolute inset-x-0 bottom-8 items-center">
          <CaptureButton
            camera={camera}
            onCapture={handleMediaCaptured}
            onError={handleError as (error: Error) => void}
            enabled={isCameraInitialized}
            size={captureButtonSize}
          />
        </View>
      )}
    </View>
  );
} 