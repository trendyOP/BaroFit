import { Dimensions, Platform } from 'react-native';
import type { Landmark } from '~/hooks/usePoseLandmarks';

// 카메라 위치 타입
export type CameraPosition = 'front' | 'back';

// 카메라 레이아웃 정보
export interface CameraLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 화면 크기 정보
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 정확한 좌표 변환 함수
 * 90° 반시계 회전 + 전면 카메라 거울 반전 + 카메라 레이아웃 매핑
 * 
 * @param p 랜드마크 포인트 (정규화된 좌표 0-1)
 * @param cam 카메라 위치
 * @param camLayout 카메라 뷰의 실제 레이아웃 정보
 * @returns 화면 절대 좌표
 */
export function transformPoint(
  p: { x: number; y: number },
  cam: 'front' | 'back',
  camLayout: { x: number; y: number; width: number; height: number }
): { x: number; y: number } {
  // 1. 90° 반시계 회전 (portrait 기준)
  let x = p.y;
  let y = 1 - p.x;

  // 2. Android 전면 카메라에서 좌우 반전 보정
  if (cam === 'front' && Platform.OS === 'android') {
    x = 1 - x;
  }

  // 3. Android 후면 카메라에서 상하 좌우 반전 보정
  if (cam === 'back' && Platform.OS === 'android') {
    y = 1 - y;
    x = 1 - x;
  }

  // 4. 실제 카메라 뷰 레이아웃에 맞게 스케일링
  return {
    x: camLayout.x + x * camLayout.width,
    y: camLayout.y + y * camLayout.height
  };
}

/**
 * 포즈 랜드마크 좌표를 화면 좌표로 변환
 * MediaPipe는 정규화된 좌표 (0-1)를 반환하므로 화면 크기에 맞게 변환
 * 
 * @param landmark 정규화된 랜드마크 좌표 (0-1 범위)
 * @param frameWidth 카메라 프레임 너비
 * @param frameHeight 카메라 프레임 높이
 * @param isFrontCamera 프론트 카메라 여부 (미러링 보정용)
 * @param flipY Y축 뒤집기 여부 (상하 반전 보정용)
 * @returns 화면 픽셀 좌표
 */
export function transformLandmarkToScreen(
  landmark: Landmark,
  frameWidth: number,
  frameHeight: number,
  isFrontCamera: boolean = true,
  flipY: boolean = true
): { x: number; y: number } {
  // 1. 정규화된 좌표를 프레임 크기에 맞게 변환
  let x = landmark.x * frameWidth;
  let y = landmark.y * frameHeight;
  
  // 2. 프론트 카메라의 경우 X축 미러링 보정
  if (isFrontCamera) {
    x = frameWidth - x;
  }
  
  // 3. Y축 뒤집기 보정 (상하 반전) - 방법 2 시도
  if (flipY) {
    // 방법 2: 정규화 좌표에서 뒤집기 (더 정확할 수 있음)
    y = (1 - landmark.y) * frameHeight;
  }
  
  // 4. 카메라 프레임 크기를 화면 크기에 맞게 스케일링
  const scaleX = SCREEN_WIDTH / frameWidth;
  const scaleY = SCREEN_HEIGHT / frameHeight;
  
  // 5. 화면 좌표로 최종 변환
  return {
    x: x * scaleX,
    y: y * scaleY
  };
}

/**
 * 카메라 방향에 따른 좌표 회전 보정
 * 
 * @param x 원본 X 좌표
 * @param y 원본 Y 좌표
 * @param rotation 회전 각도 (도 단위)
 * @param centerX 회전 중심 X
 * @param centerY 회전 중심 Y
 * @returns 회전 보정된 좌표
 */
export function rotateCoordinate(
  x: number,
  y: number,
  rotation: number,
  centerX: number = SCREEN_WIDTH / 2,
  centerY: number = SCREEN_HEIGHT / 2
): { x: number; y: number } {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  // 중심점을 원점으로 이동
  const translatedX = x - centerX;
  const translatedY = y - centerY;
  
  // 회전 변환
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  // 다시 원래 위치로 이동
  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY
  };
}

/**
 * 포즈 랜드마크 배열을 화면 좌표로 일괄 변환
 * 
 * @param landmarks 랜드마크 배열
 * @param frameWidth 카메라 프레임 너비
 * @param frameHeight 카메라 프레임 높이
 * @param isFrontCamera 프론트 카메라 여부
 * @param rotation 추가 회전 보정 (도 단위)
 * @param flipY Y축 뒤집기 여부
 * @returns 변환된 화면 좌표 배열
 */
export function transformPoseToScreen(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number,
  isFrontCamera: boolean = true,
  rotation: number = 0,
  flipY: boolean = true
): Array<{ x: number; y: number; visibility?: number }> {
  return landmarks.map(landmark => {
    // 기본 좌표 변환
    let { x, y } = transformLandmarkToScreen(landmark, frameWidth, frameHeight, isFrontCamera, flipY);
    
    // 추가 회전 보정이 필요한 경우
    if (rotation !== 0) {
      const rotated = rotateCoordinate(x, y, rotation);
      x = rotated.x;
      y = rotated.y;
    }
    
    return {
      x,
      y,
      visibility: landmark.visibility
    };
  });
}

/**
 * 랜드마크 가시성 필터링
 * 
 * @param landmarks 랜드마크 배열
 * @param minVisibility 최소 가시성 임계값 (0-1)
 * @returns 필터링된 랜드마크 배열
 */
export function filterVisibleLandmarks(
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
  minVisibility: number = 0.5
): Array<{ x: number; y: number; visibility?: number }> {
  return landmarks.filter(landmark => 
    landmark.visibility === undefined || landmark.visibility >= minVisibility
  );
}

/**
 * 포즈 랜드마크 인덱스별 색상 매핑
 * MediaPipe Pose 랜드마크 순서에 따른 색상 분류
 */
export function getLandmarkColor(index: number): string {
  // MediaPipe Pose 랜드마크 인덱스 기준
  if (index <= 10) {
    // 얼굴 및 목 (0-10)
    return '#FF6B6B'; // 빨강
  } else if (index <= 16) {
    // 어깨 및 팔 (11-16)
    return '#4ECDC4'; // 청록
  } else if (index <= 22) {
    // 손목 및 손가락 (17-22)
    return '#45B7D1'; // 파랑
  } else if (index <= 28) {
    // 엉덩이 및 다리 (23-28)
    return '#96CEB4'; // 초록
  } else {
    // 발목 및 발가락 (29-32)
    return '#FFEAA7'; // 노랑
  }
}

/**
 * MediaPipe Pose 랜드마크 연결 정보
 * 각 연결은 [시작 인덱스, 끝 인덱스] 형태
 */
export const POSE_CONNECTIONS = [
  // 얼굴
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10],
  
  // 몸통
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  
  // 팔
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
  [24, 26], [26, 28], [28, 30], [30, 32],
  
  // 다리
  [11, 23], [12, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32]
];

/**
 * 랜드마크 연결선 생성
 * 
 * @param landmarks 변환된 랜드마크 배열
 * @param connections 연결 정보 배열
 * @returns 연결선 배열
 */
export function generatePoseConnections(
  landmarks: Array<{ x: number; y: number; visibility?: number }>,
  connections: number[][] = POSE_CONNECTIONS
): Array<{ start: { x: number; y: number }; end: { x: number; y: number }; color: string }> {
  const lines: Array<{ start: { x: number; y: number }; end: { x: number; y: number }; color: string }> = [];
  
  connections.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    
    // 두 랜드마크 모두 가시성이 충분한 경우만 선 그리기
    if (start && end && 
        (start.visibility === undefined || start.visibility >= 0.5) &&
        (end.visibility === undefined || end.visibility >= 0.5)) {
      
      lines.push({
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        color: getLandmarkColor(startIdx)
      });
    }
  });
  
  return lines;
}

/**
 * 디버깅용 좌표 정보 로깅
 */
export function logLandmarkDebugInfo(
  landmark: Landmark,
  index: number,
  transformed: { x: number; y: number }
): void {
  console.log(`Landmark ${index}:`, {
    original: { x: landmark.x, y: landmark.y },
    transformed: { x: transformed.x, y: transformed.y },
    visibility: landmark.visibility
  });
} 

// 측면 포즈 감지용 랜드마크 인덱스들 (MediaPipe/MoveNet 확장 기준)
export const SIDE_POSE_LANDMARK_INDICES = [
  0,   // nose
  1,   // left_eye
  2,   // right_eye
  11,  // left_shoulder
  12,  // right_shoulder
  13,  // left_elbow
  14,  // right_elbow
  15,  // left_wrist
  16,  // right_wrist
  23,  // left_hip
  24,  // right_hip
  25,  // left_knee
  26,  // right_knee
  27,  // left_ankle
  28   // right_ankle
];

// 측면 포즈 전용 연결선 정의
export const SIDE_POSE_CONNECTIONS = [
  // 머리-어깨
  { start: 0, end: 5, color: '#FF6B6B' }, // nose - left_shoulder
  { start: 0, end: 6, color: '#FF6B6B' }, // nose - right_shoulder
  
  // 어깨-팔
  { start: 5, end: 7, color: '#4ECDC4' }, // left_shoulder - left_elbow
  { start: 6, end: 8, color: '#4ECDC4' }, // right_shoulder - right_elbow
  
  // 팔-손목
  { start: 7, end: 9, color: '#45B7D1' }, // left_elbow - left_wrist
  { start: 8, end: 10, color: '#45B7D1' }, // right_elbow - right_wrist
  
  // 어깨-엉덩이
  { start: 5, end: 11, color: '#96CEB4' }, // left_shoulder - left_hip
  { start: 6, end: 12, color: '#96CEB4' }, // right_shoulder - right_hip
  
  // 엉덩이-무릎
  { start: 11, end: 13, color: '#FFEAA7' }, // left_hip - left_knee
  { start: 12, end: 14, color: '#FFEAA7' }, // right_hip - right_knee
  
  // 무릎-발목
  { start: 13, end: 15, color: '#DDA0DD' }, // left_knee - left_ankle
  { start: 14, end: 16, color: '#DDA0DD' }  // right_knee - right_ankle
];

// 측면 포즈 랜드마크 필터링 함수
export function filterSidePoseLandmarks(landmarks: any[]): any[] {
  if (!landmarks || landmarks.length === 0) return [];
  
  // 첫 번째 포즈만 사용
  const firstPose = landmarks[0];
  if (!firstPose) return [];
  
  // 측면 전용 랜드마크만 필터링
  return SIDE_POSE_LANDMARK_INDICES.map(index => {
    if (index < firstPose.length) {
      return firstPose[index];
    }
    return null;
  }).filter(landmark => landmark !== null);
}

// 측면 포즈 연결선 생성 함수
export function generateSidePoseConnections(landmarks: any[]): Array<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
}> {
  if (!landmarks || landmarks.length === 0) return [];
  
  const connections: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    color: string;
  }> = [];
  
  SIDE_POSE_CONNECTIONS.forEach(connection => {
    const startLandmark = landmarks[connection.start];
    const endLandmark = landmarks[connection.end];
    
    if (startLandmark && endLandmark && 
        startLandmark.visibility > 0.3 && endLandmark.visibility > 0.3) {
      connections.push({
        start: { x: startLandmark.x, y: startLandmark.y },
        end: { x: endLandmark.x, y: endLandmark.y },
        color: connection.color
      });
    }
  });
  
  return connections;
} 