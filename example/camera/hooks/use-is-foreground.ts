/**
 * app/camera/hooks/use-is-foreground.ts
 * 
 * 앱이 포그라운드 상태인지 확인하는 커스텀 훅
 */
import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * 앱이 포그라운드 상태인지 확인하는 훅
 * @returns 현재 앱이 포그라운드 상태인지 여부
 */
export default function useIsForeground(): boolean {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const onChange = (state: AppStateStatus): void => {
      setIsForeground(state === 'active');
    };
    
    const subscription = AppState.addEventListener('change', onChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
} 