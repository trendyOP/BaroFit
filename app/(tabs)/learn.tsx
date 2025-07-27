import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

// 자세 유형 정보
const POSTURE_TYPES = [
  {
    type: 'A형',
    name: '골반-어깨 불균형형',
    description: '골반이 좌우로 기울어지고 어깨가 회전된 상태',
    characteristics: [
      '골반 좌우 높이 차이',
      '어깨 회전 및 기울임',
      '척추 측면 만곡 증가'
    ],
    commonCauses: [
      '한쪽 다리로만 서는 습관',
      '가방을 한쪽으로만 메는 습관',
      '불균형한 운동 패턴'
    ],
    icon: 'body-outline',
    color: '#FF6B6B'
  },
  {
    type: 'B형',
    name: '앉은 자세형 (거북목형)',
    description: '골반이 앞으로 기울고 머리가 앞으로 나온 상태',
    characteristics: [
      '골반 전방 경사',
      '전방 머리 위치 (거북목)',
      '어깨 둥글게 말림'
    ],
    commonCauses: [
      '장시간 데스크워크',
      '스마트폰 과다 사용',
      '잘못된 앉은 자세'
    ],
    icon: 'phone-portrait-outline',
    color: '#4ECDC4'
  },
  {
    type: 'C형',
    name: '편측 압박형',
    description: '한쪽으로 치우친 자세로 인한 편측 압박',
    characteristics: [
      '척추 측면 만곡',
      '어깨 한쪽 내림',
      '골반 편측 압박'
    ],
    commonCauses: [
      '한쪽으로 기대는 습관',
      '편측 근육 약화',
      '불균형한 작업 환경'
    ],
    icon: 'trending-down-outline',
    color: '#45B7D1'
  },
  {
    type: 'D형',
    name: '군인형 자세',
    description: '과도하게 곧게 선 자세로 인한 문제',
    characteristics: [
      '과도한 척추 직선화',
      '머리 과도한 후방 위치',
      '어깨 과도한 후방 당김'
    ],
    commonCauses: [
      '잘못된 바른자세 인식',
      '과도한 교정 의식',
      '군인식 자세 습관'
    ],
    icon: 'fitness-outline',
    color: '#96CEB4'
  },
  {
    type: 'E형',
    name: '정상 자세',
    description: '이상적인 균형잡힌 자세',
    characteristics: [
      '골반 수평 정렬',
      '척추 자연스러운 곡선',
      '머리와 어깨 균형'
    ],
    commonCauses: [
      '규칙적인 운동',
      '바른 생활 습관',
      '근력 균형 유지'
    ],
    icon: 'checkmark-circle-outline',
    color: '#34C759'
  }
];

// 주요 문제점들
const COMMON_ISSUES = [
  {
    name: '거북목',
    tag: '#거북목',
    description: '머리가 어깨보다 앞으로 나온 상태',
    symptoms: ['목과 어깨 통증', '두통', '어깨 결림'],
    prevention: ['스마트폰 사용 시간 줄이기', '모니터 높이 조절', '목 스트레칭'],
    icon: 'person-outline',
    color: '#FF9500'
  },
  {
    name: '어깨 뒤틀림',
    tag: '#어깨뒤틀림',
    description: '좌우 어깨 높이가 다르거나 회전된 상태',
    symptoms: ['어깨 통증', '팔 저림', '목 비대칭'],
    prevention: ['양쪽 균등한 가방 사용', '어깨 균형 운동', '자세 교정'],
    icon: 'fitness-outline',
    color: '#FF3B30'
  },
  {
    name: '골반 뒤틀림',
    tag: '#골반뒤틀림',
    description: '골반이 좌우로 기울거나 회전된 상태',
    symptoms: ['허리 통증', '다리 길이 차이', '보행 이상'],
    prevention: ['균등한 체중 분배', '골반 교정 운동', '한쪽 다리로 서지 않기'],
    icon: 'body-outline',
    color: '#FF6B6B'
  },
  {
    name: '척추 측만',
    tag: '#척추측만',
    description: '척추가 좌우로 휘어진 상태',
    symptoms: ['허리 통증', '어깨 비대칭', '갈비뼈 돌출'],
    prevention: ['대칭적인 운동', '올바른 앉은 자세', '정기적인 검진'],
    icon: 'medical-outline',
    color: '#8E44AD'
  }
];

export default function LearnScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알아보기</Text>
        <Text style={styles.headerSubtitle}>자세 유형과 문제점을 알아보세요</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 자세 유형 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자세 유형별 특징</Text>
          <Text style={styles.sectionDescription}>
            BaroFit에서 감지할 수 있는 5가지 자세 유형입니다
          </Text>
          
          {POSTURE_TYPES.map((posture, index) => (
            <View key={index} style={styles.postureCard}>
              <View style={styles.postureHeader}>
                <View style={styles.postureIconContainer}>
                  <Ionicons 
                    name={posture.icon as any} 
                    size={24} 
                    color={posture.color} 
                  />
                </View>
                <View style={styles.postureInfo}>
                  <Text style={styles.postureType}>{posture.type}</Text>
                  <Text style={styles.postureName}>{posture.name}</Text>
                </View>
              </View>
              
              <Text style={styles.postureDescription}>{posture.description}</Text>
              
              <View style={styles.characteristicsContainer}>
                <Text style={styles.characteristicsTitle}>주요 특징:</Text>
                {posture.characteristics.map((char, idx) => (
                  <Text key={idx} style={styles.characteristicItem}>• {char}</Text>
                ))}
              </View>
              
              <View style={styles.causesContainer}>
                <Text style={styles.causesTitle}>주요 원인:</Text>
                {posture.commonCauses.map((cause, idx) => (
                  <Text key={idx} style={styles.causeItem}>• {cause}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 주요 문제점 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주요 자세 문제점</Text>
          <Text style={styles.sectionDescription}>
            자주 발견되는 자세 문제점들과 예방법입니다
          </Text>
          
          {COMMON_ISSUES.map((issue, index) => (
            <View key={index} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <View style={[styles.issueIconContainer, { backgroundColor: `${issue.color}20` }]}>
                  <Ionicons 
                    name={issue.icon as any} 
                    size={20} 
                    color={issue.color} 
                  />
                </View>
                <View style={styles.issueInfo}>
                  <Text style={styles.issueName}>{issue.name}</Text>
                  <Text style={[styles.issueTag, { color: issue.color }]}>{issue.tag}</Text>
                </View>
              </View>
              
              <Text style={styles.issueDescription}>{issue.description}</Text>
              
              <View style={styles.symptomsContainer}>
                <Text style={styles.symptomsTitle}>주요 증상:</Text>
                <View style={styles.symptomsList}>
                  {issue.symptoms.map((symptom, idx) => (
                    <View key={idx} style={styles.symptomTag}>
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.preventionContainer}>
                <Text style={styles.preventionTitle}>예방 방법:</Text>
                {issue.prevention.map((prev, idx) => (
                  <Text key={idx} style={styles.preventionItem}>• {prev}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 도움말 섹션 */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.helpTitle}>정확한 분석을 위한 팁</Text>
            <View style={styles.helpContent}>
              <Text style={styles.helpItem}>• 충분한 조명이 있는 곳에서 측정하세요</Text>
              <Text style={styles.helpItem}>• 전신이 화면에 보이도록 거리를 조절하세요</Text>
              <Text style={styles.helpItem}>• 평소 자세를 자연스럽게 유지하세요</Text>
              <Text style={styles.helpItem}>• 꽉 끼지 않는 옷을 착용하세요</Text>
            </View>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    lineHeight: 20,
  },
  postureCard: {
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
  postureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postureIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postureInfo: {
    flex: 1,
  },
  postureType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  postureName: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  postureDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  characteristicsContainer: {
    marginBottom: 12,
  },
  characteristicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  characteristicItem: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 2,
  },
  causesContainer: {
    marginTop: 8,
  },
  causesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  causeItem: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 2,
  },
  issueCard: {
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
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  issueTag: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  issueDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  symptomsContainer: {
    marginBottom: 12,
  },
  symptomsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  symptomsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  symptomText: {
    fontSize: 12,
    color: '#666666',
  },
  preventionContainer: {},
  preventionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  preventionItem: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 2,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
    marginBottom: 12,
  },
  helpContent: {
    width: '100%',
  },
  helpItem: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    marginBottom: 6,
  },
  bottomSpacer: {
    height: 40,
  },
}); 