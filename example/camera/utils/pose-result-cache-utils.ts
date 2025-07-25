import * as MediaLibrary from 'expo-media-library';
import type { PoseAnalysisResult } from './pose-analysis-utils';
import type { BodyOrientation } from '~/hooks/useBodyOrientation';

export interface PoseResultData {
  id: string;
  timestamp: number;
  orientation: BodyOrientation;
  analysis: PoseAnalysisResult;
  landmarks: any[]; // 랜드마크 데이터 (필요시)
}

// 고유 ID 생성
export function generateResultId(): string {
  return `pose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 결과 데이터 생성
export function createPoseResultData(
  orientation: BodyOrientation,
  analysis: PoseAnalysisResult,
  landmarks?: any[]
): PoseResultData {
  return {
    id: generateResultId(),
    timestamp: Date.now(),
    orientation,
    analysis,
    landmarks: landmarks || [],
  };
}

// 결과를 JSON 문자열로 변환
export function serializePoseResult(result: PoseResultData): string {
  return JSON.stringify(result, null, 2);
}

// JSON 문자열을 결과 객체로 변환
export function deserializePoseResult(jsonString: string): PoseResultData | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to deserialize pose result:', error);
    return null;
  }
}

// 결과를 캐시에 저장 (임시로 MediaLibrary 사용)
export async function savePoseResultToCache(result: PoseResultData): Promise<string | null> {
  try {
    // 권한 요청
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('MediaLibrary permission not granted');
      return null;
    }

    // 결과를 JSON 파일로 저장
    const jsonData = serializePoseResult(result);
    const fileName = `pose_result_${result.id}.json`;
    
    // 임시로 MediaLibrary에 저장 (실제로는 expo-file-system 사용 권장)
    // 여기서는 콘솔에 출력하는 것으로 대체
    console.log('Saving pose result to cache:', fileName);
    console.log('Result data:', jsonData);
    
    return fileName;
  } catch (error) {
    console.error('Failed to save pose result to cache:', error);
    return null;
  }
}

// 캐시에서 결과 불러오기
export async function loadPoseResultFromCache(fileName: string): Promise<PoseResultData | null> {
  try {
    // 임시로 콘솔에서 확인 (실제로는 파일에서 읽기)
    console.log('Loading pose result from cache:', fileName);
    
    // 실제 구현에서는 파일에서 JSON 읽기
    return null;
  } catch (error) {
    console.error('Failed to load pose result from cache:', error);
    return null;
  }
}

// 캐시에서 모든 결과 불러오기
export async function loadAllPoseResultsFromCache(): Promise<PoseResultData[]> {
  try {
    // 임시로 빈 배열 반환 (실제로는 캐시 디렉토리 스캔)
    console.log('Loading all pose results from cache');
    return [];
  } catch (error) {
    console.error('Failed to load all pose results from cache:', error);
    return [];
  }
}

// 캐시에서 결과 삭제
export async function deletePoseResultFromCache(fileName: string): Promise<boolean> {
  try {
    console.log('Deleting pose result from cache:', fileName);
    return true;
  } catch (error) {
    console.error('Failed to delete pose result from cache:', error);
    return false;
  }
}

// 캐시 정리 (오래된 파일 삭제)
export async function cleanupPoseResultCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  try {
    const now = Date.now();
    const results = await loadAllPoseResultsFromCache();
    let deletedCount = 0;
    
    for (const result of results) {
      if (now - result.timestamp > maxAge) {
        const fileName = `pose_result_${result.id}.json`;
        await deletePoseResultFromCache(fileName);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old pose results`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup pose result cache:', error);
    return 0;
  }
} 