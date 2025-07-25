import { useMemo, useRef } from 'react';
import type { Pose } from './usePoseLandmarks';
import type { BodyOrientation } from './useBodyOrientation';
import { analyzePose, type PoseAnalysisResult } from '~/app/camera/utils/pose-analysis-utils';

export function usePoseAnalysis(
  landmarks: Pose[],
  orientation: BodyOrientation,
  devicePosition: 'front' | 'back' = 'back'
): PoseAnalysisResult {
  const shoulderStatusRef = useRef<'정상' | '문제 있음'>('정상');
  const analysis = useMemo(() => {
    const result = analyzePose(landmarks, orientation, devicePosition, shoulderStatusRef.current);
    shoulderStatusRef.current = result.shoulderStatus;
    return result;
  }, [landmarks, orientation, devicePosition]);

  return analysis;
} 