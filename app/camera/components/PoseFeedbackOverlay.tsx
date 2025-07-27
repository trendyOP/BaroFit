import type { Pose } from '@/app/camera/hooks/usePoseLandmarks';
import type { PoseAnalysisResult } from '@/app/camera/utils/pose-analysis-utils';
import { POSE_LANDMARKS } from '@/app/camera/utils/pose-analysis-utils';
import { transformPoint, type CameraLayout } from '@/app/camera/utils/pose-utils';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface PoseFeedbackOverlayProps {
  analysis: PoseAnalysisResult;
  landmarks: Pose[];
  camLayout: CameraLayout;
  devicePosition: 'front' | 'back';
  frameWidth: number;
  frameHeight: number;
  showDetails?: boolean;
}

export function PoseFeedbackOverlay({
  analysis,
  landmarks,
  camLayout,
  devicePosition,
  frameWidth,
  frameHeight,
  showDetails = true,
}: PoseFeedbackOverlayProps) {
  const hasShoulderIssue = analysis.shoulderSymmetry < 80 || analysis.kinematicChain.shoulder.issues.length > 0;
  const hasPelvicIssue = !analysis.kinematicChain.pelvic.isLevel || analysis.kinematicChain.pelvic.issues.length > 0;

  const getLandmarkPoints = (landmarkIndex: number) => {
    if (!landmarks || landmarks.length === 0) return null;
    const firstPose = landmarks[0];
    if (!firstPose || firstPose.length < landmarkIndex) return null;
    
    const landmark = firstPose[landmarkIndex];
    if (!landmark) return null;

    return transformPoint(
      { x: landmark.x, y: landmark.y },
      devicePosition,
      camLayout,
      frameWidth,
      frameHeight
    );
  };

  const leftShoulderPoint = getLandmarkPoints(POSE_LANDMARKS.LEFT_SHOULDER);
  const rightShoulderPoint = getLandmarkPoints(POSE_LANDMARKS.RIGHT_SHOULDER);
  const leftHipPoint = getLandmarkPoints(POSE_LANDMARKS.LEFT_HIP);
  const rightHipPoint = getLandmarkPoints(POSE_LANDMARKS.RIGHT_HIP);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* 어깨 문제 시각화 */}
      {hasShoulderIssue && leftShoulderPoint && (
        <>
          <View
            style={[
              styles.issueCircle,
              {
                left: leftShoulderPoint.x - 15,
                top: leftShoulderPoint.y - 15,
                borderColor: analysis.shoulderSymmetry < 80 ? '#ff4444' : '#44ff44', // 어깨 대칭성에 따라 색상 변경
              },
            ]}
          />
          {/* 왼쪽 어깨 경고 아이콘 제거 */}
        </>
      )}
      {hasShoulderIssue && rightShoulderPoint && (
        <>
          <View
            style={[
              styles.issueCircle,
              {
                left: rightShoulderPoint.x - 15,
                top: rightShoulderPoint.y - 15,
                borderColor: analysis.shoulderSymmetry < 80 ? '#ff4444' : '#44ff44', // 어깨 대칭성에 따라 색상 변경
              },
            ]}
          />
          {analysis.shoulderSymmetry < 80 && (
            <Image
              source={require('@/assets/images/warning-icon.png')}
              style={[
                styles.warningIcon,
                {
                  left: rightShoulderPoint.x + 10,
                  top: rightShoulderPoint.y - 30,
                },
              ]}
            />
          )}
        </>
      )}

      {/* 골반 문제 시각화 */}
      {hasPelvicIssue && leftHipPoint && (
        <>
          <View
            style={[
              styles.issueCircle,
              {
                left: leftHipPoint.x - 15,
                top: leftHipPoint.y - 15,
                borderColor: analysis.kinematicChain.pelvic.isLevel ? '#44ff44' : '#ff4444',
              },
            ]}
          />
          {/* 왼쪽 골반 경고 아이콘 제거 */}
        </>
      )}
      {hasPelvicIssue && rightHipPoint && (
        <>
          <View
            style={[
              styles.issueCircle,
              {
                left: rightHipPoint.x - 15,
                top: rightHipPoint.y - 15,
                borderColor: analysis.kinematicChain.pelvic.isLevel ? '#44ff44' : '#ff4444',
              },
            ]}
          />
          {!analysis.kinematicChain.pelvic.isLevel && (
            <Image
              source={require('@/assets/images/warning-icon.png')}
              style={[
                styles.warningIcon,
                {
                  left: rightHipPoint.x + 10,
                  top: rightHipPoint.y - 30,
                },
              ]}
            />
          )}
        </>
      )}

      {/* 상단 고정: 점수만 */}
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
        </View>
      </View>

      {/* 하단 고정: 문제점/권장사항 */}
      {showDetails && (
        <View style={styles.bottomFixedContainer}>
          {analysis.issues.length > 0 && (
            <View style={styles.issuesContainer}>
              <Text style={styles.issuesTitle}>발견된 문제:</Text>
              {analysis.issues.map((issue, index) => (
                <Text key={`issue-${index}`} style={styles.issueText}>- {issue}</Text>
              ))}
            </View>
          )}
          {analysis.recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>권장사항:</Text>
              {analysis.recommendations.map((rec, index) => (
                <Text key={`rec-${index}`} style={styles.recommendationText}>- {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}
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
  },
  warningIcon: {
    position: 'absolute',
    width: 60,
    height: 60,
    resizeMode: 'contain',
    zIndex: 10,
  },
  topFixedContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  scoreBox: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  scoreLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomFixedContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  issuesContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  issuesTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  issueText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  recommendationsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 200, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  recommendationsTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
}); 