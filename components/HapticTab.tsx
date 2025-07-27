import { useSettings } from '@/contexts/SettingsContext'; // SettingsContext 임포트
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { settings } = useSettings(); // 설정 가져오기

  return (
    <PlatformPressable
      {...props}
      onPress={(ev) => {
        console.log(`[HapticTab] onPress! 햅틱 설정: ${settings.hapticsEnabled}`);
        if (settings.hapticsEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          console.log('[HapticTab] onPress에서 햅틱 발생!');
        }
        props.onPress?.(ev);
      }}
    />
  );
}
