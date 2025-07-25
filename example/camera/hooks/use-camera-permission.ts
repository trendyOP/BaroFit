/**
 * app/camera/hooks/use-camera-permission.ts
 * 
 * 카메라 권한 관리를 위한 커스텀 훅 및 유틸리티
 */
import { useState, useCallback, useEffect } from 'react';
import { Camera, CameraPermissionStatus, CameraDevice, useCameraDevices } from 'react-native-vision-camera';
import { Linking } from 'react-native';

// 유틸리티 함수 (permission.ts에서 이동)
/**
 * 카메라 권한 상태 확인
 */
export const getCameraPermissionStatus = async (): Promise<CameraPermissionStatus> => {
  return await Camera.getCameraPermissionStatus();
};

/**
 * 카메라 권한 요청
 * @returns 권한 요청 결과
 */
export const requestCameraPermission = async (): Promise<CameraPermissionStatus> => {
  console.log('Requesting camera permission...');
  const permission = await Camera.requestCameraPermission();
  console.log(`Camera permission status: ${permission}`);

  if (permission === 'denied') {
    await Linking.openSettings();
  }
  
  return permission;
};

/**
 * 카메라 권한이 있는지 확인
 */
export const hasCameraPermission = (status: CameraPermissionStatus): boolean => {
  return status === 'granted';
};

/**
 * 카메라 권한 관리 훅
 */
export default function useCameraPermission(shouldCheckOnMount: boolean = true) {
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>('not-determined');
  const [isGranted, setIsGranted] = useState<boolean>(false);
  
  // 카메라 장치 목록 가져오기
  const devices = useCameraDevices();
  
  // 사용 가능한 카메라 기기 필터링
  const availableDevices = devices
    .filter((device): device is CameraDevice => device !== null && device !== undefined);

  // 권한 상태 체크
  const checkPermission = useCallback(async () => {
    const status = await getCameraPermissionStatus();
    setPermissionStatus(status);
    setIsGranted(hasCameraPermission(status));
    return status;
  }, []);

  // 권한 요청
  const requestPermission = useCallback(async () => {
    const status = await requestCameraPermission();
    setPermissionStatus(status);
    setIsGranted(hasCameraPermission(status));
    return status;
  }, []);

  // 마운트 시 권한 체크
  useEffect(() => {
    if (shouldCheckOnMount) {
      checkPermission();
    }
  }, [shouldCheckOnMount, checkPermission]);

  return {
    permissionStatus,
    isGranted,
    checkPermission,
    requestPermission,
    devices: availableDevices,
  };
}
