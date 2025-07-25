/**
 * app/camera/hooks/use-zoom-control.ts
 * 
 * 카메라 줌 제어를 위한 커스텀 훅
 */
import { useCallback, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { CameraDevice } from 'react-native-vision-camera';

/**
 * 카메라 줌 제어를 위한 훅
 * @param device 카메라 장치
 * @param maxZoomFactor 최대 줌 비율 (기본값: 10)
 * @returns 줌 관련 값과 함수들
 */
export default function useZoomControl(
  device: CameraDevice | null | undefined,
  maxZoomFactor: number = 10
) {
  // 줌 값 (Reanimated shared value)
  const zoom = useSharedValue(1);
  
  // 장치가 변경될 때 줌 초기화
  useEffect(() => {
    if (device) {
      zoom.value = device.neutralZoom || 1;
    }
  }, [device, zoom]);
  
  // 장치별 최소/최대 줌 계산
  const minZoom = device?.minZoom || 1;
  const maxZoom = device ? Math.min(device.maxZoom, maxZoomFactor) : maxZoomFactor;
  
  // 줌 업데이트 함수
  const onZoomUpdate = useCallback((value: number) => {
    // eslint-disable-next-line react-compiler/react-compiler
    zoom.value = Math.max(minZoom, Math.min(maxZoom, value));
  }, [zoom, minZoom, maxZoom]);
  
  return {
    zoom,
    minZoom,
    maxZoom,
    onZoomUpdate
  };
} 