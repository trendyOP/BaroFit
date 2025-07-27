import { usePoseData } from '@/contexts/PoseDataContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ISSUE_MAPPING: Record<string, { icon: string; color: string; severity: 'mild' | 'moderate' | 'severe' }> = {
  '골반이 기울어져 있습니다': { icon: 'body-outline', color: '#FF9500', severity: 'moderate' },
  '골반이 심하게 기울어져 있습니다': { icon: 'body-outline', color: '#FF3B30', severity: 'severe' },
  '어깨가 기울어져 있습니다': { icon: 'fitness-outline', color: '#FF9500', severity: 'moderate' },
  '어깨가 심하게 기울어져 있습니다': { icon: 'fitness-outline', color: '#FF3B30', severity: 'severe' },
  '머리가 앞으로 나와 있습니다': { icon: 'person-outline', color: '#FF9500', severity: 'moderate' },
  '머리가 심하게 앞으로 나와 있습니다': { icon: 'person-outline', color: '#FF3B30', severity: 'severe' },
  '척추가 측만되어 있습니다': { icon: 'medical-outline', color: '#FF9500', severity: 'moderate' },
  '척추가 심하게 측만되어 있습니다': { icon: 'medical-outline', color: '#FF3B30', severity: 'severe' },
  '목이 굽어져 있습니다': { icon: 'person-outline', color: '#FF9500', severity: 'moderate' },
  '목이 심하게 굽어져 있습니다': { icon: 'person-outline', color: '#FF3B30', severity: 'severe' },
};

const ISSUE_TAGS: Record<string, string> = {
  '골반이 기울어져 있습니다': '#골반뒤틀림',
  '골반이 심하게 기울어져 있습니다': '#골반뒤틀림',
  '어깨가 기울어져 있습니다': '#어깨뒤틀림',
  '어깨가 심하게 기울어져 있습니다': '#어깨뒤틀림',
  '머리가 앞으로 나와 있습니다': '#거북목',
  '머리가 심하게 앞으로 나와 있습니다': '#거북목',
  '척추가 측만되어 있습니다': '#척추측만',
  '척추가 심하게 측만되어 있습니다': '#척추측만',
  '목이 굽어져 있습니다': '#거북목',
  '목이 심하게 굽어져 있습니다': '#거북목',
};

export function IssuesSummary() {
  const { currentIssues, getUniqueIssues } = usePoseData();
  const uniqueIssues = getUniqueIssues();

  console.log('이슈 요약:', {
    currentIssues: currentIssues.length,
    uniqueIssues: uniqueIssues.length,
    issues: currentIssues
  });

  // 현재 문제점들을 태그로 변환
  const currentTags = [...new Set(currentIssues.map(issue => ISSUE_TAGS[issue]).filter(Boolean))];
  
  // 전체 발견된 문제점들을 태그로 변환
  const allTags = [...new Set(uniqueIssues.map(issue => ISSUE_TAGS[issue]).filter(Boolean))];

  if (allTags.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="checkmark-circle-outline" size={32} color="#34C759" />
        <Text style={styles.emptyTitle}>양호한 자세</Text>
        <Text style={styles.emptySubtitle}>현재까지 특별한 문제점이 발견되지 않았습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>발견된 문제점</Text>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: currentIssues.length > 0 ? '#FF3B30' : '#34C759' }
          ]} />
          <Text style={styles.statusText}>
            {currentIssues.length > 0 ? '문제 감지됨' : '정상'}
          </Text>
        </View>
      </View>
      
      <View style={styles.tagsContainer}>
        {allTags.map((tag, index) => {
          const isActive = currentTags.includes(tag);
          return (
            <View
              key={index}
              style={[
                styles.tag,
                isActive ? styles.activeTag : styles.inactiveTag
              ]}
            >
              <Text style={[
                styles.tagText,
                isActive ? styles.activeTagText : styles.inactiveTagText
              ]}>
                {tag}
              </Text>
              {isActive && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="alert-circle" size={12} color="#FF3B30" />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {currentIssues.length > 0 && (
        <View style={styles.currentIssues}>
          <Text style={styles.currentIssuesTitle}>현재 감지된 문제점:</Text>
          {currentIssues.slice(0, 3).map((issue, index) => {
            const mapping = ISSUE_MAPPING[issue];
            if (!mapping) return null;
            
            return (
              <View key={index} style={styles.issueItem}>
                <Ionicons 
                  name={mapping.icon as any} 
                  size={16} 
                  color={mapping.color} 
                />
                <Text style={[styles.issueText, { color: mapping.color }]}>
                  {issue}
                </Text>
              </View>
            );
          })}
          {currentIssues.length > 3 && (
            <Text style={styles.moreIssues}>
              외 {currentIssues.length - 3}개 문제점
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeTag: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  inactiveTag: {
    backgroundColor: '#F2F2F7',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTagText: {
    color: '#FF3B30',
  },
  inactiveTagText: {
    color: '#8E8E93',
  },
  activeIndicator: {
    marginLeft: 4,
  },
  currentIssues: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 16,
  },
  currentIssuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  issueText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  moreIssues: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
}); 