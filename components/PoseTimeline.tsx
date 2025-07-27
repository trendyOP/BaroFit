import { usePoseData } from '@/contexts/PoseDataContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const TIMELINE_WIDTH = screenWidth - 40;
const TIMELINE_HEIGHT = 200;

interface TimelinePoint {
  x: number;
  y: number;
  score: number;
  time: number;
  issues: string[];
}

export function PoseTimeline() {
  const { poseHistory } = usePoseData();

  console.log('타임라인 렌더링:', {
    historyLength: poseHistory.length,
    latestEntry: poseHistory[poseHistory.length - 1]
  });

  const timelineData = useMemo(() => {
    if (poseHistory.length === 0) {
      console.log('타임라인 데이터 없음');
      return [];
    }

    // 데이터가 1개만 있어도 표시
    if (poseHistory.length === 1) {
      const entry = poseHistory[0];
      console.log('타임라인 데이터 1개:', entry);
      return [{
        x: TIMELINE_WIDTH / 2,
        y: TIMELINE_HEIGHT - ((entry.postureScore / 100) * (TIMELINE_HEIGHT - 60)) - 40,
        score: entry.postureScore,
        time: entry.timestamp,
        issues: entry.issues,
      }];
    }

    const sortedHistory = [...poseHistory].sort((a, b) => a.timestamp - b.timestamp);
    const minTime = sortedHistory[0].timestamp;
    const maxTime = sortedHistory[sortedHistory.length - 1].timestamp;
    const timeRange = maxTime - minTime || 1;

    const result = sortedHistory.map((entry, index) => {
      const x = ((entry.timestamp - minTime) / timeRange) * (TIMELINE_WIDTH - 40) + 20;
      const y = TIMELINE_HEIGHT - ((entry.postureScore / 100) * (TIMELINE_HEIGHT - 60)) - 40;
      
      return {
        x,
        y,
        score: entry.postureScore,
        time: entry.timestamp,
        issues: entry.issues,
      };
    });

    console.log('타임라인 데이터 생성됨:', result.length, '개');
    return result;
  }, [poseHistory]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#34C759';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  if (poseHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={48} color="#8E8E93" />
        <Text style={styles.emptyText}>자세 분석을 시작하면 타임라인이 표시됩니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timeline}>
          {/* 배경 그리드 */}
          <View style={styles.grid}>
            {[0, 25, 50, 75, 100].map(score => (
              <View key={score} style={[styles.gridLine, { 
                bottom: ((score / 100) * (TIMELINE_HEIGHT - 60)) + 40 
              }]}>
                <Text style={styles.gridLabel}>{score}</Text>
              </View>
            ))}
          </View>

          {/* 자세점수 라인 연결 */}
          {timelineData.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = timelineData[index - 1];
            
            const lineWidth = Math.sqrt(
              Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
            );
            const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180 / Math.PI;
            
            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.connectionLine,
                  {
                    left: prevPoint.x,
                    bottom: TIMELINE_HEIGHT - prevPoint.y,
                    width: lineWidth,
                    transform: [{ rotate: `${angle}deg` }],
                  }
                ]}
              />
            );
          })}

          {/* 데이터 포인트 */}
          {timelineData.map((point, index) => (
            <View key={index} style={[styles.dataPointContainer, { 
              left: point.x - 6, 
              bottom: TIMELINE_HEIGHT - point.y - 6 
            }]}>
              <View style={[
                styles.point,
                { backgroundColor: getScoreColor(point.score) }
              ]} />
              {point.issues.length > 0 && (
                <View style={styles.issueMarker}>
                  <Ionicons name="warning" size={10} color="#FF3B30" />
                </View>
              )}
              
              {/* 점수 표시 (일부 포인트만) */}
              {index % Math.max(1, Math.floor(timelineData.length / 5)) === 0 && (
                <View style={styles.scoreLabel}>
                  <Text style={styles.scoreLabelText}>{Math.round(point.score)}</Text>
                </View>
              )}
            </View>
          ))}

          {/* 시간 축 라벨 */}
          {timelineData.length > 0 && (
            <>
              <Text style={[styles.timeLabel, { left: 20, bottom: 10 }]}>
                {formatTime(timelineData[0].time)}
              </Text>
              <Text style={[styles.timeLabel, { 
                left: TIMELINE_WIDTH - 60, 
                bottom: 10 
              }]}>
                {formatTime(timelineData[timelineData.length - 1].time)}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* 범례 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>양호 (80+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>주의 (60-79)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>위험 (60미만)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  timeline: {
    width: Math.max(TIMELINE_WIDTH, 400),
    height: TIMELINE_HEIGHT,
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  grid: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 20,
    bottom: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    color: '#8E8E93',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    position: 'absolute',
    left: -15,
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#007AFF',
    transformOrigin: 'left center',
  },
  dataPointContainer: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  point: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  issueMarker: {
    position: 'absolute',
    top: -16,
    left: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  scoreLabel: {
    position: 'absolute',
    top: -30,
    left: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scoreLabelText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 10,
    color: '#8E8E93',
    position: 'absolute',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#8E8E93',
  },
}); 