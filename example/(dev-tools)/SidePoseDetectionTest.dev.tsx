/**
 * app/(dev-tools)/SidePoseDetectionTest.dev.tsx
 * 
 * 측면 포즈 감지 모드 테스트 도구
 * - 측면 포즈 감지 모드 실행
 * - 측면 랜드마크 시각화 확인
 * - 측면 분석 결과 확인
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { SidePoseDetectionMode } from '~/app/camera/modes/SidePoseDetectionMode';

export default function SidePoseDetectionTest() {
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleStartTest = () => {
    setIsCameraActive(true);
  };

  const handleStopTest = () => {
    setIsCameraActive(false);
  };

  const handleBack = () => {
    router.back();
  };

  if (isCameraActive) {
    return (
      <View style={styles.container}>
        <SidePoseDetectionMode />
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStopTest}
        >
          <Text style={styles.stopButtonText}>테스트 종료</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>측면 포즈 감지 테스트</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 테스트 개요</Text>
          <Text style={styles.description}>
            측면 포즈 감지 모드의 기능을 테스트합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 테스트 항목</Text>
          <View style={styles.testItems}>
            <Text style={styles.testItem}>• 측면 랜드마크 감지</Text>
            <Text style={styles.testItem}>• 측면 전용 연결선 표시</Text>
            <Text style={styles.testItem}>• 측면 자세 분석</Text>
            <Text style={styles.testItem}>• 방향별 측면 분석</Text>
            <Text style={styles.testItem}>• 카메라 전환 기능</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 측면 랜드마크</Text>
          <Text style={styles.description}>
            측면에서 잘 보이는 랜드마크들만 사용합니다:
          </Text>
          <View style={styles.landmarkList}>
            <Text style={styles.landmarkItem}>• 머리: 코, 왼쪽/오른쪽 귀</Text>
            <Text style={styles.landmarkItem}>• 어깨: 왼쪽/오른쪽 어깨</Text>
            <Text style={styles.landmarkItem}>• 팔: 팔꿈치, 손목</Text>
            <Text style={styles.landmarkItem}>• 몸통: 엉덩이</Text>
            <Text style={styles.landmarkItem}>• 다리: 무릎, 발목</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 시각화 특징</Text>
          <View style={styles.visualFeatures}>
            <Text style={styles.featureItem}>• 측면 전용 색상 코딩</Text>
            <Text style={styles.featureItem}>• 더 큰 랜드마크 포인트 (12px)</Text>
            <Text style={styles.featureItem}>• 두꺼운 연결선 (3px)</Text>
            <Text style={styles.featureItem}>• 측면 모드 표시 배너</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTest}
        >
          <Text style={styles.startButtonText}>측면 포즈 감지 테스트 시작</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 테스트 가이드</Text>
          <Text style={styles.guideText}>
            1. 측면을 향해 서서 포즈를 취하세요{'\n'}
            2. 측면 랜드마크가 정확히 감지되는지 확인하세요{'\n'}
            3. 측면 전용 연결선이 올바르게 표시되는지 확인하세요{'\n'}
            4. 다양한 방향에서 측면 포즈를 테스트해보세요{'\n'}
            5. 전면/후면 카메라 전환을 테스트해보세요
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 25,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testItems: {
    marginTop: 10,
  },
  testItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  landmarkList: {
    marginTop: 10,
  },
  landmarkItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  visualFeatures: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  startButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guideText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stopButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 