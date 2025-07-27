import { IssuesSummary } from '@/components/IssuesSummary';
import { PoseTimeline } from '@/components/PoseTimeline';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { usePoseData } from '@/contexts/PoseDataContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecordScreen() {
  const { poseHistory, clearHistory } = usePoseData();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { settings } = useSettings();

  console.log('기록 화면 렌더링 - 데이터 개수:', poseHistory.length);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>기록</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자세점수 타임라인</Text>
          <PoseTimeline />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlButton, styles.clearButton]} onPress={() => {
            clearHistory();
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}>
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.controlButtonText}>데이터 초기화</Text>
          </TouchableOpacity>
        </View>

        {/* Discovered Issues Section */}
        <View style={styles.section}>
          <IssuesSummary />
        </View>

        {/* Detailed Analysis Button */}
        <TouchableOpacity 
          style={styles.analysisButton}
          onPress={() => {
            setShowSubscriptionModal(true);
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
        >
          <Ionicons name="analytics-outline" size={20} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.analysisButtonText}>상세분석 보기</Text>
        </TouchableOpacity>

        {/* Spacer for bottom space */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Subscription Modal */}
      <SubscriptionModal 
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
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

  content: {
    flex: 1,
    padding: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E8E93',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  analysisButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  analysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomSpacer: {
    height: 100,
  },
}); 