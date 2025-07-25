import { Dimensions, Platform } from 'react-native';

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
  camLayout: { x: number; y: number; width: number; height: number },
  frameWidth: number, 
  frameHeight: number 
): { x: number; y: number } {
  // 1. MediaPipe 좌표를 화면 방향에 맞게 회전 및 미러링합니다.
  // 세로 모드에서는 프레임이 90도 회전되므로 x와 y를 교체합니다.
  let x_rotated = p.y;
  let y_rotated = 1 - p.x;

  // Android 전면 카메라는 좌우가 반전되므로 x축을 뒤집어줍니다.
  if (cam === 'front' && Platform.OS === 'android') {
    x_rotated = 1 - x_rotated;
  }

  // Android 후면 카메라에서 상하 좌우 반전 보정
  if (cam === 'back' && Platform.OS === 'android') {
    y_rotated = 1 - y_rotated;
    x_rotated = 1 - x_rotated;
  }

  // 2. 'cover' 모드를 기준으로 스케일 및 오프셋을 계산합니다.
  // 카메라 프레임과 화면 레이아웃의 종횡비를 계산합니다.
  const frameAspectRatio = frameWidth / frameHeight; // 회전 후 프레임 종횡비 (e.g., 640/480)
  const layoutAspectRatio = camLayout.height / camLayout.width; // 화면 레이아웃 종횡비 (e.g., 683/360)

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  // 화면이 프레임보다 '세로로 길면' (taller), 높이를 기준으로 스케일링하고 너비를 자릅니다.
  if (layoutAspectRatio > frameAspectRatio) {
    scale = camLayout.height / frameWidth;
    const scaledWidth = frameHeight * scale;
    offsetX = (scaledWidth - camLayout.width) / 2;
  } 
  // 화면이 프레임보다 '가로로 길면' (wider), 너비를 기준으로 스케일링하고 높이를 자릅니다.
  else {
    scale = camLayout.width / frameHeight;
    const scaledHeight = frameWidth * scale;
    offsetY = (scaledHeight - camLayout.height) / 2;
  }

  // 3. 최종 좌표를 계산합니다.
  // 회전된 좌표에 스케일을 적용하고, 잘려나간 부분(offset)을 빼서 정확한 위치를 찾습니다.
  const finalX = (x_rotated * frameHeight * scale) - offsetX;
  const finalY = (y_rotated * frameWidth * scale) - offsetY;
  
  return {
    x: finalX,
    y: finalY
  };
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