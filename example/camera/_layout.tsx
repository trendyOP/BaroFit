/**
 * app/camera/_layout.tsx
 * 
 * 카메라 기능 레이아웃
 */
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
} 