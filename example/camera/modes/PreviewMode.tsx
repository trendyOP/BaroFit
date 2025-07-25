/**
 * app/camera/modes/PreviewMode.tsx
 * 
 * 미디어 미리보기 모드 컴포넌트 (간소화 버전)
 */
import React from 'react';
import { View, Image as RNImage } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// UI 컴포넌트
import { Text } from '~/components/ui/text';

// 컴포넌트
import { PreviewControls } from '../views/camera-controls';

// 타입
import { PreviewModeProps } from '../types';

export default function PreviewMode({
  capturedMedia,
  onClose,
  showControls = true,
  containerStyle,
  compact = false, // 새로 추가된 compact 모드
}: PreviewModeProps & { compact?: boolean }) {
  console.log('PreviewMode received capturedMedia:', capturedMedia);

  if (!capturedMedia) {
    console.warn('PreviewMode: capturedMedia is missing or invalid!');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <Text style={{ color: 'white' }}>미리보기할 이미지를 불러오지 못했습니다.</Text>
      </View>
    );
  }
  
  const imageUri = capturedMedia.path.startsWith('file://') ? capturedMedia.path : `file://${capturedMedia.path}`;

  return (
    <View style={[
      compact ? { height: 200 } : { flex: 1 }, 
      { backgroundColor: 'black' }, 
      containerStyle
    ]}>
      {!compact && <StatusBar hidden />}
      
      {/* 캡처된 미디어 표시 */}
      <RNImage
        source={{ uri: imageUri }}
        style={{ flex: 1 }}
        resizeMode="contain"
        onError={(error) => console.error('RNImage load error:', error.nativeEvent.error)}
      />
      
      {/* 미리보기 컨트롤 (compact 모드에서는 숨김) */}
      {!compact && showControls && (
        <PreviewControls
          showControls={showControls}
          onClose={onClose}
          onAiAnalyze={() => {}} // 기본 빈 함수
          isAnalyzing={false}
        />
      )}
    </View>
  );
} 