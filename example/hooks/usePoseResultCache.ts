import { useCallback, useEffect, useRef } from 'react';
import type { PoseAnalysisResult } from '~/app/camera/utils/pose-analysis-utils';
import type { BodyOrientation } from './useBodyOrientation';
import { 
  createPoseResultData, 
  savePoseResultToCache,
  type PoseResultData 
} from '~/app/camera/utils/pose-result-cache-utils';

export function usePoseResultCache() {
  const lastSavedRef = useRef<string>('');
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 결과 저장 함수
  const saveResult = useCallback(async (
    orientation: BodyOrientation,
    analysis: PoseAnalysisResult,
    landmarks?: any[]
  ) => {
    try {
      const resultData = createPoseResultData(orientation, analysis, landmarks);
      const fileName = await savePoseResultToCache(resultData);
      
      if (fileName) {
        lastSavedRef.current = fileName;
        console.log('✅ Pose result saved successfully:', fileName);
      }
      
      return fileName;
    } catch (error) {
      console.error('❌ Failed to save pose result:', error);
      return null;
    }
  }, []);

  // 실시간 저장 (주기적으로 저장)
  const startAutoSave = useCallback((
    orientation: BodyOrientation,
    analysis: PoseAnalysisResult,
    landmarks?: any[]
  ) => {
    // 기존 인터벌 정리
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    // 5초마다 저장
    saveIntervalRef.current = setInterval(() => {
      saveResult(orientation, analysis, landmarks);
    }, 5000);
  }, [saveResult]);

  // 자동 저장 중지
  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    saveResult,
    startAutoSave,
    stopAutoSave,
    lastSaved: lastSavedRef.current,
  };
} 