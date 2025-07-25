import { analyzePose, type PoseAnalysisResult } from '@/app/camera/utils/pose-analysis-utils';
import { useMemo } from 'react';
import type { BodyOrientation } from './useBodyOrientation';
import type { Pose } from './usePoseLandmarks';

const initialAnalysisResult: PoseAnalysisResult = {
  shoulderAngle: 0,
  shoulderSymmetry: 100,
  postureScore: 0,
  issues: [],
  recommendations: [],
};

export function usePoseAnalysis(
  landmarks: Pose[],
  orientation: BodyOrientation,
  devicePosition: 'front' | 'back'
) {
  const analysisResult = useMemo<PoseAnalysisResult>(() => {
    if (!landmarks || landmarks.length === 0) {
      return initialAnalysisResult;
    }
    return analyzePose(landmarks, orientation, devicePosition);
  }, [landmarks, orientation, devicePosition]);

  return analysisResult;
} 