import { useSettings } from '@/contexts/SettingsContext'; // SettingsContext 임포트
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics'; // Haptics 임포트
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: '일반 구독',
    price: '1,990원',
    period: '월',
    features: [
      '기본 자세 분석',
      '실시간 피드백',
      '타임라인 기록',
      '문제점 감지',
      '기본 리포트'
    ],
    color: '#007AFF',
    popular: false
  },
  {
    id: 'premium',
    name: '프리미엄 구독',
    price: '2,990원',
    period: '월',
    features: [
      '고급 자세 분석',
      '상세 키네마틱 분석',
      '개인 맞춤 운동 추천',
      'AI 자세 교정 가이드',
      '월간 상세 리포트',
      '전문가 상담 연결',
      '무제한 데이터 저장'
    ],
    color: '#FF6B6B',
    popular: true
  }
];

export function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const { settings } = useSettings(); // 설정 가져오기

  const handleSubscribe = () => {
    // TODO: 실제 구독 처리 로직
    console.log('구독 처리:', selectedPlan);
    if (settings.hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  };

  const handleClose = () => {
    if (settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BaroFit Pro</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 프리미엄 혜택 소개 */}
          <View style={styles.introSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="analytics" size={48} color="#007AFF" />
            </View>
            <Text style={styles.introTitle}>상세 자세 분석으로</Text>
            <Text style={styles.introTitle}>더 건강한 생활을 시작하세요</Text>
            <Text style={styles.introSubtitle}>
              AI 기반 전문가 수준의 자세 분석과 개인 맞춤 솔루션을 만나보세요
            </Text>
          </View>

          {/* 구독 플랜 */}
          <View style={styles.plansSection}>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                  plan.popular && styles.popularPlan
                ]}
                onPress={() => {
                  setSelectedPlan(plan.id);
                  if (settings.hapticsEnabled) {
                    Haptics.selectionAsync(); // 선택 시 가벼운 햅틱
                  }
                }}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>인기</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, selectedPlan === plan.id && styles.selectedText]}>
                      {plan.name}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.planPrice, selectedPlan === plan.id && styles.selectedText]}>
                        {plan.price}
                      </Text>
                      <Text style={[styles.planPeriod, selectedPlan === plan.id && styles.selectedText]}>
                        /{plan.period}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.radioButton,
                    selectedPlan === plan.id && styles.selectedRadio
                  ]}>
                    {selectedPlan === plan.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons 
                        name="checkmark" 
                        size={16} 
                        color={selectedPlan === plan.id ? '#FFFFFF' : plan.color} 
                      />
                      <Text style={[
                        styles.featureText,
                        selectedPlan === plan.id && styles.selectedText
                      ]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 보장 및 안내 */}
          <View style={styles.guaranteeSection}>
            <View style={styles.guaranteeItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
              <Text style={styles.guaranteeText}>7일 무료 체험</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Ionicons name="refresh-outline" size={20} color="#34C759" />
              <Text style={styles.guaranteeText}>언제든 해지 가능</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Ionicons name="card-outline" size={20} color="#34C759" />
              <Text style={styles.guaranteeText}>안전한 결제</Text>
            </View>
          </View>

          {/* 약관 */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              구독 시 <Text style={styles.termsLink}>이용약관</Text> 및 <Text style={styles.termsLink}>개인정보처리방침</Text>에 동의하게 됩니다.
              구독은 언제든 해지할 수 있으며, 무료 체험 기간 중 해지 시 요금이 청구되지 않습니다.
            </Text>
          </View>
        </ScrollView>

        {/* 구독 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>
              {selectedPlan === 'basic' ? '일반 구독 시작하기' : '프리미엄 구독 시작하기'}
            </Text>
            <Text style={styles.subscribeButtonSubtext}>
              7일 무료 체험 • {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price}/{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.period}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#E3F2FD',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 32,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  plansSection: {
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  popularPlan: {
    borderColor: '#FF6B6B',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planPeriod: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 2,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    flex: 1,
  },
  guaranteeSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  guaranteeItem: {
    alignItems: 'center',
    flex: 1,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  termsSection: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscribeButtonSubtext: {
    color: '#E3F2FD',
    fontSize: 12,
    marginTop: 4,
  },
}); 