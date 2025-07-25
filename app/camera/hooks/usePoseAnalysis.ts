import { analyzePose, type PoseAnalysisResult } from '@/app/camera/utils/pose-analysis-utils';
import { useMemo, useRef } from 'react';
import type { BodyOrientation } from './useBodyOrientation';
import type { Pose } from './usePoseLandmarks';

export function usePoseAnalysis(
  landmarks: Pose[],
  orientation: BodyOrientation,
  devicePosition: 'front' | 'back' = 'back'
): PoseAnalysisResult {
  const shoulderStatusRef = useRef<'정상' | '문제 있음'>('정상');
  const analysis = useMemo(() => {
    const result: any = analyzePose(landmarks, orientation, devicePosition);
    // If extended analysis returns shoulderStatus, update ref (for future expansion)
    if (result?.shoulderStatus) {
      shoulderStatusRef.current = result.shoulderStatus;
    }
    return result;
  }, [landmarks, orientation, devicePosition]);

  return analysis as PoseAnalysisResult;
} 