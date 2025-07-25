import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PoseAnalysisResult } from '~/app/camera/utils/pose-analysis-utils';
import type { Landmark, Pose } from '~/hooks/usePoseLandmarks';
import { POSE_LANDMARKS } from '~/app/camera/utils/pose-analysis-utils';

interface PoseFeedbackOverlayProps {
  analysis: PoseAnalysisResult;
  landmarks: Pose[];
  camLayout: { x: number; y: number; width: number; height: number };
  devicePosition: 'front' | 'back';
}

export function PoseFeedbackOverlay({
  analysis,
  landmarks,
  camLayout,
  devicePosition,
}: PoseFeedbackOverlayProps) {
  // 어깨 랜드마크 좌표 변환
  const getShoulderPoints = () => {
    if (!landmarks || landmarks.length === 0) return null;
    
    const firstPose = landmarks[0];
    if (!firstPose || firstPose.length < 33) return null;
    
    const leftShoulder = firstPose[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = firstPose[POSE_LANDMARKS.RIGHT_SHOULDER];
    
    if (!leftShoulder || !rightShoulder) return null;
    
    // 좌표 변환 (기존 transformPoint 로직 사용)
    const transformPoint = (p: { x: number; y: number }) => {
      let x = p.y; // 90° 반시계 회전
      let y = 1 - p.x;
      
      if (devicePosition === 'front') {
        x = 1 - x; // 전면 카메라 미러링
      }
      if (devicePosition === 'back') {
        x = 1 - x; // 후면 카메라 미러링
        y = 1 - y;
      }
      
      return {
        x: camLayout.x + x * camLayout.width,
        y: camLayout.y + y * camLayout.height,
      };
    };
    
    return {
      left: transformPoint({ x: leftShoulder.x, y: leftShoulder.y }),
      right: transformPoint({ x: rightShoulder.x, y: rightShoulder.y }),
    };
  };

  const shoulderPoints = getShoulderPoints();
  const hasIssues = analysis.issues.length > 0;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 어깨 문제 시각화 */}
      {hasIssues && shoulderPoints && (
        <>
          {/* 왼쪽 어깨 강조 */}
          <View
            style={[
              styles.issueCircle,
              {
                left: shoulderPoints.left.x - 15,
                top: shoulderPoints.left.y - 15,
                borderColor: analysis.shoulderSymmetry < 80 ? '#ff4444' : '#44ff44',
              },
            ]}
          />
          {/* 오른쪽 어깨 강조 */}
          <View
            style={[
              styles.issueCircle,
              {
                left: shoulderPoints.right.x - 15,
                top: shoulderPoints.right.y - 15,
                borderColor: analysis.shoulderSymmetry < 80 ? '#ff4444' : '#44ff44',
              },
            ]}
          />
        </>
      )}

      {/* 상단 고정: 점수/어깨 대칭성 */}
      <View style={styles.topFixedContainer}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>자세 점수</Text>
            <Text style={[
              styles.scoreValue,
              { color: analysis.postureScore >= 80 ? '#44ff44' : analysis.postureScore >= 60 ? '#ffaa00' : '#ff4444' }
            ]}>
              {analysis.postureScore}점
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>어깨 대칭성</Text>
            <Text style={[
              styles.scoreValue,
              { color: analysis.shoulderSymmetry >= 80 ? '#44ff44' : '#ff4444' }
            ]}>
              {analysis.shoulderSymmetry}%
            </Text>
          </View>
        </View>
      </View>

      {/* 하단 고정: 문제점/권장사항 전체 비활성화 */}
      {/**
      <View style={styles.bottomFixedContainer}>
        <View style={styles.issuesContainer}>
          <Text style={styles.issuesTitle}>발견된 문제:</Text>
        </View>
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>권장사항:</Text>
        </View>
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  issueCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  topFixedContainer: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 32,
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 90,
  },
  scoreLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomFixedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  issuesContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  issuesTitle: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  issueText: {
    color: '#ff6666',
    fontSize: 12,
    marginBottom: 2,
  },
  recommendationsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
  },
  recommendationsTitle: {
    color: '#44ff44',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationText: {
    color: '#66ff66',
    fontSize: 12,
    marginBottom: 2,
  },
}); 