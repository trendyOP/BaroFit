import type { PoseAnalysisResult } from '@/app/camera/utils/pose-analysis-utils';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export interface PoseDataEntry {
  id: string;
  timestamp: number;
  postureScore: number;
  shoulderAngle: number;
  shoulderSymmetry: number;
  issues: string[];
  recommendations: string[];
  kinematicChain: PoseAnalysisResult['kinematicChain'];
  posturePattern: PoseAnalysisResult['posturePattern'];
}

interface PoseDataContextType {
  poseHistory: PoseDataEntry[];
  currentIssues: string[];
  addPoseData: (data: PoseAnalysisResult) => void;
  clearHistory: () => void;
  getTimelineData: () => { time: number; score: number; issues: string[] }[];
  getUniqueIssues: () => string[];
}

const PoseDataContext = createContext<PoseDataContextType | undefined>(undefined);

export function PoseDataProvider({ children }: { children: ReactNode }) {
  const [poseHistory, setPoseHistory] = useState<PoseDataEntry[]>([]);
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);

  console.log('PoseDataProvider 렌더링 - 히스토리 개수:', poseHistory.length);

  const addPoseData = useCallback((data: PoseAnalysisResult) => {
    console.log('Context에 자세 데이터 추가:', {
      postureScore: data.postureScore,
      issues: data.issues,
      timestamp: new Date().toLocaleTimeString()
    });

    const entry: PoseDataEntry = {
      id: `pose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      postureScore: data.postureScore,
      shoulderAngle: data.shoulderAngle,
      shoulderSymmetry: data.shoulderSymmetry,
      issues: data.issues,
      recommendations: data.recommendations,
      kinematicChain: data.kinematicChain,
      posturePattern: data.posturePattern,
    };

    setPoseHistory(prev => {
      // 최근 100개 항목만 유지
      const newHistory = [...prev, entry].slice(-100);
      console.log('전체 히스토리 개수:', newHistory.length);
      return newHistory;
    });

    // 현재 문제점 업데이트
    setCurrentIssues(data.issues);
  }, []);

  const clearHistory = useCallback(() => {
    console.log('히스토리 데이터 초기화');
    setPoseHistory([]);
    setCurrentIssues([]);
  }, []);

  const getTimelineData = useCallback(() => {
    return poseHistory.map(entry => ({
      time: entry.timestamp,
      score: entry.postureScore,
      issues: entry.issues,
    }));
  }, [poseHistory]);

  const getUniqueIssues = useCallback(() => {
    const allIssues = poseHistory.flatMap(entry => entry.issues);
    return [...new Set(allIssues)];
  }, [poseHistory]);

  // Context value 메모이제이션
  const contextValue = useMemo(() => ({
    poseHistory,
    currentIssues,
    addPoseData,
    clearHistory,
    getTimelineData,
    getUniqueIssues,
  }), [poseHistory, currentIssues, addPoseData, clearHistory, getTimelineData, getUniqueIssues]);

  return (
    <PoseDataContext.Provider value={contextValue}>
      {children}
    </PoseDataContext.Provider>
  );
}

export function usePoseData() {
  const context = useContext(PoseDataContext);
  if (context === undefined) {
    throw new Error('usePoseData must be used within a PoseDataProvider');
  }
  return context;
} 