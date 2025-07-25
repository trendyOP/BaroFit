/**
 * app/(dev-tools)/PoseDetection.dev.tsx
 * 
 * 포즈 감지 테스트 도구 - 방향별 분석, 실시간 피드백, 캐시 저장 기능 포함
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { PoseDetectionMode } from '../camera/modes/PoseDetectionMode';

export default function PoseDetectionDev() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <PoseDetectionMode />
      </View>
    </SafeAreaView>
  );
}  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  cameraContainer: {
    flex: 1,
  },
});