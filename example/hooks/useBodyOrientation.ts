import { useState, useCallback } from 'react';

export type BodyOrientation = 'front' | 'back' | 'left' | 'right';

export function useBodyOrientation() {
  const [orientation, setOrientation] = useState<BodyOrientation>('front');

  const changeOrientation = useCallback((newOrientation: BodyOrientation) => {
    setOrientation(newOrientation);
  }, []);

  const getOrientationLabel = useCallback((orientation: BodyOrientation) => {
    switch (orientation) {
      case 'front': return '정면';
      case 'back': return '후면';
      case 'left': return '좌측면';
      case 'right': return '우측면';
      default: return '정면';
    }
  }, []);

  return {
    orientation,
    changeOrientation,
    getOrientationLabel,
    isFront: orientation === 'front',
    isBack: orientation === 'back',
    isLeft: orientation === 'left',
    isRight: orientation === 'right',
  };
} 