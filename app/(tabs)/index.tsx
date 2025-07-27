import { usePoseData } from '@/contexts/PoseDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [realTimeFeedback, setRealTimeFeedback] = React.useState(true);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const adImageAspectRatio = 778 / 124; // 이미지 원본 비율
  const adCalculatedHeight = screenWidth / adImageAspectRatio; // 화면 너비에 따른 적정 높이
  const { poseHistory } = usePoseData();

  const handleGoToPoseDetection = () => {
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
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Recent Posture Score Card */}
        <TouchableOpacity style={styles.scoreCard}>
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
          <Text style={styles.properPostureDescription}>
            {latestPose ? `최근 자세 측정 시간: ${latestDate}` : '자세 측정이 아직 시작되지 않았습니다.'}
          </Text>
        </View>

        {/* Real-time Feedback Toggle */}
        <View style={styles.feedbackCard}>
          <View style={styles.feedbackLeft}>
            <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
            <Text style={styles.feedbackText}>실시간 피드백 받아보기</Text>
          </View>
          <Switch
            value={realTimeFeedback}
            onValueChange={setRealTimeFeedback}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>

      {/* Advertisement Section */}
      <View style={styles.adWrapper}>
        <TouchableOpacity style={[styles.adSection, { height: adCalculatedHeight }]}>
          <Image 
            source={require('@/assets/images/hackerton-banner.png')} 
            style={styles.adImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
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
  properPostureDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 30, // 높이 조절을 위해 lineHeight를 줄임
    textAlign: 'center',
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
  },
});
