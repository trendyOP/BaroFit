/**
 * app/camera/views/camera-controls.tsx
 * 
 * 카메라 UI 컨트롤 컴포넌트 모음
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// UI 컴포넌트
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';

// 카메라 모드 타입
import { CameraMode } from '../types';


// 상단 컨트롤 컴포넌트
interface TopControlsProps {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
  showModeToggle?: boolean;
}

export function TopControls({ 
  currentMode, 
  onModeChange, 
  showModeToggle = true 
}: TopControlsProps) {
  return (
    <View className="absolute inset-x-0 top-0 flex-row items-center justify-between p-4">
      {/* 왼쪽 빈 공간 */}
      <View className="h-10 w-10" />
      
      {/* 모드 전환 토글 */}
      {showModeToggle && (
        <View className="flex-row items-center rounded-full bg-black/50 p-1">
          {/* 바코드 스캔 모드 */}
          <TouchableOpacity
            className={`flex-row items-center rounded-full px-3 py-2 ${
              currentMode === 'scanner' ? 'bg-white' : 'bg-transparent'
            }`}
            onPress={() => onModeChange('scanner')}
          >
            <Ionicons 
              name="barcode-outline" 
              size={16} 
              color={currentMode === 'scanner' ? '#000' : '#fff'} 
            />
            <Text className={`ml-1 text-sm ${
              currentMode === 'scanner' ? 'text-black' : 'text-white'
            }`}>
              바코드 스캔
            </Text>
          </TouchableOpacity>
          
          {/* 음식 촬영 모드 */}
          <TouchableOpacity
            className={`flex-row items-center rounded-full px-3 py-2 ${
              currentMode === 'photo' ? 'bg-white' : 'bg-transparent'
            }`}
            onPress={() => onModeChange('photo')}
          >
            <Ionicons 
              name="camera-outline" 
              size={16} 
              color={currentMode === 'photo' ? '#000' : '#fff'} 
            />
            <Text className={`ml-1 text-sm ${
              currentMode === 'photo' ? 'text-black' : 'text-white'
            }`}>
              음식 촬영
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 오른쪽 빈 공간 */}
      <View className="h-10 w-10" />
    </View>
  );
}

// 우측 컨트롤 컴포넌트
interface RightControlsProps {
  showFlipCameraButton?: boolean;
  showFlashButton?: boolean;
  hasFlash?: boolean;
  enableFlash?: boolean;
  cameraPosition: 'front' | 'back';
  flash: 'off' | 'on';
  onFlipCamera: () => void;
  onFlashToggle: () => void;
}

export function RightControls({
  showFlipCameraButton = true,
  showFlashButton = true,
  hasFlash = false,
  enableFlash = true,
  flash,
  cameraPosition,
  onFlipCamera,
  onFlashToggle
}: RightControlsProps) {
 

  return (
    <View className="absolute right-4 top-20 items-center">
      {showFlipCameraButton &&  (
        <TouchableOpacity
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-[rgba(140,140,140,0.3)]"
          onPress={onFlipCamera}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {showFlashButton && hasFlash && enableFlash && cameraPosition === 'back' && (
        <TouchableOpacity
          className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-[rgba(140,140,140,0.3)]"
          onPress={onFlashToggle}
        >
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// 스캐너 가이드 오버레이
export function ScannerGuideOverlay() {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="h-72 w-72 rounded-lg border-2 border-white/50">
        <View className="absolute -left-2 -top-2 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-white" />
        <View className="absolute -right-2 -top-2 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-white" />
        <View className="absolute -bottom-2 -left-2 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-white" />
        <View className="absolute -bottom-2 -right-2 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-white" />
      </View>
    </View>
  );
}

// 스캔 결과 표시
interface ScanResultDisplayProps {
  scannedCode: string | null;
}

export function ScanResultDisplay({ scannedCode }: ScanResultDisplayProps) {
  if (!scannedCode) return null;
  
  return (
    <View className="absolute inset-x-4 bottom-8 p-4">
      <View className="rounded-xl bg-black/60 p-4">
        <Text className="text-center font-medium text-white">
          {scannedCode}
        </Text>
      </View>
    </View>
  );
}

// 미디어 미리보기 컨트롤
interface PreviewControlsProps {
  onClose: () => void;
  onAiAnalyze?: () => void;
  showControls?: boolean;
  isAnalyzing?: boolean;
}

export function PreviewControls({ 
  onClose, 
  onAiAnalyze,
  showControls = true,
  isAnalyzing = false,
}: PreviewControlsProps) {
  if (!showControls) return null;
  
  // AI 분석과 나가기 버튼은 각 화면에서 자체적으로 구현하므로 제거
  return null;
} 