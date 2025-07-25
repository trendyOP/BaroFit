/**
 * app/camera/views/capture-button.tsx
 * 
 * 카메라 촬영 버튼 컴포넌트
 */
import React, { useCallback, useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import type { Camera, PhotoFile } from 'react-native-vision-camera';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  useDerivedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// 에러 핸들러 가져오기
import { handleCameraCaptureError } from '../utils/error-handler';

const AnimatedTouchable = Reanimated.createAnimatedComponent(TouchableOpacity);

interface CaptureButtonProps {
  camera: React.RefObject<Camera>;
  onCapture: (photo: PhotoFile) => void;
  onError: (error: Error) => void;
  enabled?: boolean;
  size?: number;
}

export default function CaptureButton({
  camera,
  onCapture,
  onError,
  enabled = true,
  size = 78,
}: CaptureButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  
  // 애니메이션 상태값 - shared values 사용
  const pressed = useSharedValue(false);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 추가적인 정리 코드가 필요하면 여기에 추가
    };
  }, []);
  
  // 버튼 스타일 - size prop 활용
  const buttonStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: Math.max(2, size * 0.05),
  };
  
  // 내부 원 스타일 - size prop 활용
  const innerCircleStyle = {
    width: size * 0.8,
    height: size * 0.8,
    borderRadius: size * 0.4,
  };
  
  // 버튼 누름 상태 파생 값
  const isPressedActive = useDerivedValue(() => {
    return pressed.value;
  }, [pressed]);
  
  // 버튼 애니메이션 스타일
  const buttonAnimationStyle = useAnimatedStyle(() => {
    const buttonScale = isPressedActive.value ? 0.9 : 1;
    return {
      transform: [{
        scale: withSpring(buttonScale, {
          mass: 1,
          damping: 15,
          stiffness: 200,
        })
      }]
    };
  }, [isPressedActive]);
  
  // iOS 그림자 스타일
  const iosShadowStyle = useAnimatedStyle(() => {
    return {
      shadowColor: "#fff",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    };
  }, []);
  
  // Android 그림자 스타일
  const androidShadowStyle = useAnimatedStyle(() => ({
    elevation: 5,
  }), []);
  
  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (camera.current == null) throw new Error('Camera ref is null!');
    if (isCapturing) return;
    
    try {
      // 촬영 시작할 때 햅틱 피드백
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      setIsCapturing(true);
      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      
      // 촬영 완료 시 햅틱 피드백
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCapture(photo);
    } catch (e) {
      // 오류 시 햅틱 피드백
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // 에러 핸들러를 통해 에러 처리
      handleCameraCaptureError(e instanceof Error ? e : new Error('Unknown photo capture error'));
      onError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsCapturing(false);
    }
  }, [camera, isCapturing, onCapture, onError]);

  // 버튼 누를 때 핸들러
  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pressed.value = true;
  }, [pressed]);
  
  // 버튼에서 손 뗄 때 핸들러
  const handlePressOut = useCallback(() => {
    pressed.value = false;
  }, [pressed]);
  
  // 버튼 탭 핸들러
  const handlePress = useCallback(() => {
    capturePhoto();
  }, [capturePhoto]);

  return (
    <View className="relative items-center justify-center">
      <AnimatedTouchable
        className="items-center justify-center border-white bg-[rgba(140,140,140,0.3)]"
        style={[
          buttonStyle, 
          enabled ? null : { opacity: 0.5 },
          buttonAnimationStyle,
          // 그림자 효과
          Platform.OS === 'ios' ? iosShadowStyle : androidShadowStyle
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!enabled}
        activeOpacity={0.7}
      >
        <View
          className="items-center justify-center bg-white"
          style={innerCircleStyle}
        >
          {isCapturing && (
            <ActivityIndicator size="small" color="#333" />
          )}
        </View>
      </AnimatedTouchable>
    </View>
  );
} 