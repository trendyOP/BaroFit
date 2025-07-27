/**
 * app/(tabs)/explore.tsx
 *
 * 측면 포즈 감지 화면
 * - 측면 포즈 감지 모드 실행
 * - 측면 랜드마크 시각화 확인
 * - 측면 분석 결과 확인
 */
import { SidePoseDetectionMode } from '@/app/camera/modes/SidePoseDetectionMode';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function SidePoseDetectionScreen() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const router = useRouter();
  const { showFeedback } = useLocalSearchParams();

  // 탭이 포커스될 때 카메라를 활성화하고, 포커스를 잃을 때 비활성화합니다.
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused
      console.log('측면 포즈 감지 화면 포커스 - 카메라 활성화');
      setCameraKey(prev => prev + 1);
      setIsCameraActive(true);

      return () => {
        // Screen is unfocused
        console.log('측면 포즈 감지 화면 언포커스 - 카메라 비활성화 (데이터는 유지)');
        setIsCameraActive(false);
      };
    }, [])
  );

  const handleSwitchToFrontDetection = () => {
    setIsCameraActive(false);
    router.push({
      pathname: '/(tabs)/front-pose-detection',
      params: { showFeedback },
    });
  };

  if (isCameraActive) {
    return (
      <View style={styles.container}>
        <SidePoseDetectionMode key={cameraKey} isActive={isCameraActive} />
        <TouchableOpacity
          style={styles.switchButton}
          onPress={handleSwitchToFrontDetection}
        >
          <Text style={styles.switchButtonText}>정면자세감지로 전환</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>측면 포즈 감지</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 기능 개요</Text>
          <Text style={styles.description}>
            측면 포즈 감지 모드로 거북목과 자세를 분석합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 분석 항목</Text>
          <View style={styles.testItems}>
            <Text style={styles.testItem}>• 측면 랜드마크 감지</Text>
            <Text style={styles.testItem}>• CVA (목-어깨 각도) 측정</Text>
            <Text style={styles.testItem}>• 거북목 진단</Text>
            <Text style={styles.testItem}>• 방향별 측면 분석</Text>
            <Text style={styles.testItem}>• 실시간 자세 피드백</Text>
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
            <Text style={styles.featureItem}>• CVA 연결선 강조 (검은색)</Text>
            <Text style={styles.featureItem}>• 거북목 시 🐢 이모티콘 표시</Text>
            <Text style={styles.featureItem}>• 실시간 CVA 각도 표시</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setIsCameraActive(true)}
        >
          <Text style={styles.startButtonText}>측면 포즈 감지 시작</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 사용 가이드</Text>
          <Text style={styles.guideText}>
            1. 측면을 향해 서서 포즈를 취하세요{'\n'}
            2. CVA 각도가 50도 이상 유지되는지 확인하세요{'\n'}
            3. 거북목 경고(🐢)가 나타나지 않도록 주의하세요{'\n'}
            4. 좌측면/우측면 자동 감지를 확인하세요{'\n'}
            5. 실시간 피드백을 통해 자세를 교정하세요
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
  switchButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  switchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
