/**
 * app/(tabs)/exercise.tsx
 *
 * 정면 포즈 감지 화면
 * - 실시간 포즈 감지 및 스켈레톤 시각화
 * - 카메라 전환 기능
 * - 개선된 UI와 사용자 경험
 */
import { PoseDetectionMode } from '@/app/camera/modes/PoseDetectionMode';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FrontPoseDetectionScreen() {
  const [cameraKey, setCameraKey] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const router = useRouter();
  const { showFeedback } = useLocalSearchParams();

  // 탭이 포커스될 때 카메라를 활성화하고, 포커스를 잃을 때 비활성화합니다.
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused
      console.log('정면 포즈 감지 화면 포커스 - 카메라 활성화');
      setCameraKey(prev => prev + 1);
      setIsCameraActive(true);

      return () => {
        // Screen is unfocused
        console.log('정면 포즈 감지 화면 언포커스 - 카메라 비활성화 (데이터는 유지)');
        setIsCameraActive(false);
      };
    }, [])
  );

  if (isCameraActive) {
    return (
      <View style={styles.container}>
        <PoseDetectionMode
          key={cameraKey}
          isActive={isCameraActive}
          showFeedbackOverlay={showFeedback === 'true'}
          router={router}
          showFeedback={showFeedback}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>정면 포즈 감지</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 기능 개요</Text>
          <Text style={styles.description}>
            정면 포즈 감지 모드로 신체 균형 및 주요 관절 각도를 분석합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 분석 항목</Text>
          <View style={styles.testItems}>
            <Text style={styles.testItem}>• 정면 랜드마크 감지</Text>
            <Text style={styles.testItem}>• 어깨 및 골반 대칭성</Text>
            <Text style={styles.testItem}>• 자세 점수 및 피드백</Text>
            <Text style={styles.testItem}>• 주요 관절 각도 (예: 팔꿈치, 무릎)</Text>
            <Text style={styles.testItem}>• 실시간 문제점/권장사항</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 시각화 특징</Text>
          <View style={styles.visualFeatures}>
            <Text style={styles.featureItem}>• 실시간 스켈레톤 오버레이</Text>
            <Text style={styles.featureItem}>• 문제 부위 빨간색 원 강조</Text>
            <Text style={styles.featureItem}>• 자세 점수 시각화</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setIsCameraActive(true)}
        >
          <Text style={styles.startButtonText}>정면 포즈 감지 시작</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 사용 가이드</Text>
          <Text style={styles.guideText}>
            1. 카메라를 향해 정면으로 서세요{'\n'}
            2. 어깨와 골반이 수평을 이루는지 확인하세요{'\n'}
            3. 자세 점수를 높이도록 노력하세요{'\n'}
            4. 실시간 피드백을 참고하여 자세를 교정하세요
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
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
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
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#4CAF50',
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

});
