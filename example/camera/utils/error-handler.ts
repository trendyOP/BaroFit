/**
 * app/camera/utils/error-handler.ts
 * 
 * VisionCamera 에러 처리 유틸리티
 */
import { Alert, Platform } from 'react-native';
import { CameraRuntimeError, CameraCaptureError } from 'react-native-vision-camera';


// 에러 메시지 현지화 (필요시 다국어 지원 추가 가능)
const ErrorMessages = {
  // 권한 관련 에러
  'permission/camera-permission-denied': '카메라 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.',
  'permission/microphone-permission-denied': '마이크 권한이 거부되었습니다. 비디오 녹화를 위해 설정에서 권한을 허용해주세요.',
  
  // 디바이스 관련 에러
  'device/camera-not-available-on-simulator': '시뮬레이터에서는 카메라를 사용할 수 없습니다.',
  'device/camera-already-in-use': '카메라가 다른 앱에서 사용 중입니다.',
  'device/microphone-unavailable': '마이크를 사용할 수 없습니다. 오디오 없이 녹화합니다.',
  'device/no-device': '사용 가능한 카메라가 없습니다.',
  'device/invalid-device': '잘못된 카메라 장치입니다.',
  
  // 캡처 관련 에러
  'capture/recording-in-progress': '이미 녹화가 진행 중입니다.',
  'capture/no-recording-in-progress': '진행 중인 녹화가 없습니다.',
  'capture/file-io-error': '파일 저장 중 오류가 발생했습니다.',
  'capture/no-valid-data': '유효한 데이터가 없습니다.',
  'capture/no-data': '녹화 데이터가 없습니다. 최소 녹화 시간을 확인해주세요.',
  
  // 세션 관련 에러
  'session/camera-not-ready': '카메라가 아직 준비되지 않았습니다.',
  'session/audio-in-use-by-other-app': '오디오가 다른 앱에서 사용 중입니다.',

  // 알 수 없는 에러
  'unknown/unknown': '알 수 없는 오류가 발생했습니다.',
};

/**
 * 카메라 런타임 에러 처리 (Camera 컴포넌트의 onError에서 사용)
 */
export function handleCameraRuntimeError(error: CameraRuntimeError): void {
  console.error('카메라 에러:', error.code, error.message);
  
  // 에러 코드에 따른 적절한 처리
  const message = ErrorMessages[error.code as keyof typeof ErrorMessages] || error.message;
  
  // 권한 관련 에러의 경우 설정으로 이동 옵션 추가
  if (error.code.startsWith('permission/')) {
    Alert.alert('권한 오류', message, [
      { text: '취소', style: 'cancel' },
      { 
        text: '설정으로 이동', 
        onPress: () => {
          // 플랫폼에 따라 설정으로 이동하는 코드 (실제로는 여기에 구현 필요)
          console.log('설정으로 이동');
        }
      }
    ]);
  } else if (error.code === 'device/microphone-unavailable') {
    // 마이크 사용 불가 시 오디오 없이 계속 진행하는 경고
    Alert.alert('마이크 사용 불가', message, [{ text: '확인', style: 'default' }]);
  } else {
    // 기본 에러 알림
    Alert.alert('카메라 오류', message, [{ text: '확인', style: 'default' }]);
  }
}

/**
 * 카메라 캡처 에러 처리 (사진 촬영, 비디오 녹화 시 발생하는 에러)
 */
export function handleCameraCaptureError(error: Error): void {
  // CameraCaptureError 타입인지 확인
  if (error instanceof CameraCaptureError) {
    console.error('캡처 에러:', error.code, error.message);
    
    // 에러 코드에 따른 메시지 선택
    const message = ErrorMessages[error.code as keyof typeof ErrorMessages] || error.message;
    
    // 특정 에러 타입에 따른 처리
    if (error.code === 'capture/no-data') {
      Alert.alert('녹화 실패', '녹화 시간이 너무 짧습니다. 다시 시도해주세요.', [
        { text: '확인', style: 'default' }
      ]);
    } else if (error.code === 'capture/file-io-error') {
      Alert.alert('저장 실패', '파일을 저장하는 중 오류가 발생했습니다. 저장 공간을 확인해주세요.', [
        { text: '확인', style: 'default' }
      ]);
    } else {
      // 기본 에러 알림
      Alert.alert('캡처 오류', message, [{ text: '확인', style: 'default' }]);
    }
  } else {
    // 일반 에러인 경우
    console.error('알 수 없는 에러:', error);
    Alert.alert('오류', error.message || '알 수 없는 오류가 발생했습니다.', [
      { text: '확인', style: 'default' }
    ]);
  }
}

/**
 * 비디오 녹화 에러 처리 (특화된 처리가 필요한 경우)
 */
export function handleVideoRecordingError(error: Error): void {
  console.error('비디오 녹화 에러:', error);
  
  // 'capture/no-data' 오류가 발생한 경우
  if (error.message.includes('no data was received') || 
      (error instanceof CameraCaptureError && error.code === 'capture/no-data')) {
    Alert.alert(
      '녹화 실패',
      '녹화 시간이 너무 짧습니다. 버튼을 더 오래 누르세요.',
      [{ text: '확인', style: 'default' }]
    );
  } else {
    // 기타 녹화 관련 오류
    Alert.alert(
      '녹화 오류',
      '비디오 녹화 중 오류가 발생했습니다. 다시 시도해주세요.',
      [{ text: '확인', style: 'default' }]
    );
  }
} 