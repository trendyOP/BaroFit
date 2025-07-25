/**
 * app/camera/types.ts
 * 
 * 카메라 관련 공통 타입 정의
 */
import { StyleProp, ViewStyle } from 'react-native';
import { CameraRuntimeError, PhotoFile, CodeType } from 'react-native-vision-camera';
import { foodTypes } from 'fitlyever-ts-rest-contract';

// 카메라 모드
export type CameraMode = 'photo' | 'scanner' | 'preview' | 'pose' | 'side-pose';

// 카메라 컴포넌트 공통 Props
export interface CameraBaseProps {
  // UI 컨트롤 관련
  showControls?: boolean;
  showFlipCameraButton?: boolean;
  showFlashButton?: boolean;
  showModeToggle?: boolean;
  
  // 카메라 설정
  enableFlash?: boolean;
  
  // 크기 및 스타일 관련
  containerStyle?: StyleProp<ViewStyle>;
  captureButtonSize?: number;
  
  // 모드 전환 핸들러
  onModeChange: (mode: CameraMode) => void;
}

// 사진 촬영 모드 Props
export interface PhotoModeProps extends CameraBaseProps {
  onCapture?: (photo: PhotoFile) => void;
  onError?: (error: CameraRuntimeError) => void;
  enablePhotoCapture?: boolean;
}

// 바코드 스캔 모드 Props
export interface ScannerModeProps extends CameraBaseProps {
  onCodeScanned?: (code: string) => void;
  onFoodSelected?: (food: foodTypes.Food) => void;
  supportedCodeTypes?: CodeType[];
  isModalVisible?: boolean;
}

// 미디어 미리보기 모드 Props
export interface PreviewModeProps extends CameraBaseProps {
  capturedMedia: PhotoFile;
  onClose: () => void;
}

// 메인 카메라 페이지 Props
export interface CameraPageProps {
  // 초기 카메라 모드 설정
  initialMode?: CameraMode;
  
  // 바코드 스캔 관련
  onCodeScanned?: (code: string) => void;
  onFoodSelected?: (food: foodTypes.Food) => void;
  supportedCodeTypes?: CodeType[];
  
  // UI 컨트롤 관련
  showControls?: boolean;
  showFlipCameraButton?: boolean;
  showFlashButton?: boolean;
  showModeToggle?: boolean;
  
  // 카메라 설정
  initialCameraPosition?: 'front' | 'back';
  enableFlash?: boolean;
  
  // 이벤트 핸들러
  onCapture?: (photo: PhotoFile) => void;
  onError?: (error: CameraRuntimeError) => void;
  onModeChange?: (mode: CameraMode) => void;
  
  // 크기 및 스타일 관련
  containerStyle?: StyleProp<ViewStyle>;
  captureButtonSize?: number;
  
  // 미디어 처리
  enablePhotoCapture?: boolean;

} 