import { useCallback, useState } from 'react';

// 신체 방향 타입 정의
export type BodyOrientation = 'front' | 'back' | 'left' | 'right';

// 신체 방향 상태를 관리하는 커스텀 훅
export function useBodyOrientation(initialOrientation: BodyOrientation = 'front') {
  const [orientation, setOrientation] = useState<BodyOrientation>(initialOrientation);

  // 방향 변경 함수
  const changeOrientation = useCallback((newOrientation: BodyOrientation) => {
    setOrientation(newOrientation);
  }, []);

  // 방향에 따른 레이블 반환
  const getOrientationLabel = (o: BodyOrientation) => {
    switch (o) {
      case 'front': return '정면';
      case 'back': return '후면';
      case 'left': return '좌측면';
      case 'right': return '우측면';
      default: return '알 수 없음';
    }
  };

  return {
    orientation,
    changeOrientation,
    getOrientationLabel,
  };
} 