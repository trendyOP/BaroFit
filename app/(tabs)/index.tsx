import { usePoseData } from '@/contexts/PoseDataContext';
import { useSettings } from '@/contexts/SettingsContext'; // SettingsContext 임포트
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // Haptics 임포트
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const POSTURE_TYPE_INFO: Record<string, { name: string; description: string; color: string }> = {
  'A형': { name: '골반-어깨 불균형', description: '골반이 기울고 어깨가 회전된 상태', color: '#FF6B6B' },
  'B형': { name: '거북목형', description: '머리가 앞으로 나오고 등이 굽은 상태', color: '#4ECDC4' },
  'C형': { name: '편측 압박형', description: '한쪽으로 치우친 불균형 자세', color: '#45B7D1' },
  'D형': { name: '군인형', description: '과도하게 허리를 편 긴장 상태', color: '#96CEB4' },
  'E형': { name: '정상', description: '균형잡힌 이상적인 자세', color: '#34C759' },
  '미분류': { name: '미분류', description: '자세 유형을 분석 중입니다', color: '#8E8E93' },
};

const AD_BANNERS = [
  require('@/assets/images/hackerton-banner.png'),
  require('@/assets/images/hackerton-banner1.png'),
];

export default function HomeScreen() {
  const [realTimeFeedback, setRealTimeFeedback] = useState(true);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const adImageAspectRatio = 778 / 124; // 이미지 원본 비율
  const adCalculatedHeight = screenWidth / adImageAspectRatio; // 화면 너비에 따른 적정 높이
  const { poseHistory } = usePoseData();
  const { settings } = useSettings(); // 설정 가져오기
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);

  // 3초마다 광고 배너 슬라이드
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % AD_BANNERS.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleGoToPoseDetection = () => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/(tabs)/front-pose-detection',
      params: { showFeedback: realTimeFeedback.toString() },
    });
  };

  const latestPose = poseHistory.length > 0 ? poseHistory[poseHistory.length - 1] : null;
  const latestScore = latestPose ? Math.round(latestPose.postureScore) : 0;
  const latestDate = latestPose ? new Date(latestPose.timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\./g, '.').replace(/ /g, ' ').trim() : '--. --. -- --:--';
  const latestPosturePattern = latestPose ? latestPose.posturePattern : '미분류';
  const postureInfo = POSTURE_TYPE_INFO[latestPosturePattern] || POSTURE_TYPE_INFO['미분류'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.headerLogo}
          />
          <Text style={styles.appName}>바로핏</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => {
          if (settings.hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}>
          <Ionicons name="notifications-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Recent Posture Score Card */}
        <TouchableOpacity style={styles.scoreCard} onPress={() => {
          if (settings.hapticsEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push('/(tabs)/record');
        }}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>최근 자세점수</Text>
            <Text style={styles.scoreDate}>{latestDate}</Text>
          </View>
          <View style={styles.scoreContent}>
            <Text style={styles.scoreValue}>{latestScore}점</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${latestScore}%` }]} />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" style={styles.arrowIcon} />
          </View>
        </TouchableOpacity>

        {/* Proper Posture Button Card */}
        <TouchableOpacity style={styles.properPostureButtonCard} onPress={handleGoToPoseDetection}>
          <View style={styles.properPostureTextContainer}>
            <Ionicons name="camera-outline" size={20} color="#007AFF" />
            <Text style={styles.properPostureText}>바른자세 하러가기</Text>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" style={styles.arrowIcon} />
          </View>
        </TouchableOpacity>

        {/* Status Message Card */}
        <View style={styles.statusMessageCard}>
          <Text style={styles.postureTypeText}>최근 감지된 유형: </Text>
          <Text style={[styles.postureTypeValue, { color: postureInfo.color }]}>{postureInfo.name}</Text>
          <Text style={styles.postureTypeDescription}>{postureInfo.description}</Text>
        </View>

        {/* Real-time Feedback Toggle */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackLeft}>
            <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
            <Text style={styles.feedbackText}>실시간 피드백 받아보기</Text>
          </View>
          <Switch
            value={realTimeFeedback}
            onValueChange={(value) => {
              setRealTimeFeedback(value);
              if (settings.hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      {/* Advertisement Section */}
      <View style={styles.adWrapper}>
        <FlatList
          ref={flatListRef}
          data={AD_BANNERS}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.adSection, { width: screenWidth, height: adCalculatedHeight }]} onPress={() => {
              if (settings.hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}>
              <Image 
                source={item}
                style={styles.adImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    paddingBottom: 140, // 광고 섹션(80px) + 바텀 탭(약 60px) 높이를 고려하여 하단 패딩을 추가합니다.
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  scoreDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  arrowIcon: {
    marginLeft: 20,
  },
  properPostureTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  properPostureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
    flex: 1,
  },
  properPostureButtonCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    marginBottom: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  adWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0, // No padding on ad wrapper itself
  },
  adSection: {
    width: '100%',
    backgroundColor: '#000000', // Set black background for the banner area
    overflow: 'hidden',
  },
  adImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusMessageCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  postureTypeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  postureTypeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  postureTypeDescription: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
});
