/**
 * app/camera/utils/camera-utils.ts
 * 
 * 카메라 관련 유틸리티 함수
 */

/**
 * 줌 값을 계산하는 함수
 */
export const calculateZoom = (
  scale: number,
  minZoom: number,
  maxZoom: number,
  currentZoom: number
): number => {
  'worklet';
  // 스케일 값 기반으로 새 줌 값 계산
  const delta = Math.max(0.5, Math.min(1.5, scale)) - 1;
  return Math.min(maxZoom, Math.max(minZoom, currentZoom * (1 + delta * 0.5)));
};

// 포커스 지점 계산 함수
export const calculateFocus = (x: number, y: number) => {
  return {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
  };
};
