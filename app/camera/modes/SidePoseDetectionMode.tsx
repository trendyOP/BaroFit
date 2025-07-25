/**
 * app/camera/modes/SidePoseDetectionMode.tsx
 * 
 * 측면 포즈 감지 전용 카메라 모드 (최소화 버전)
 * - UI 요소 제거, 랜드마크만 시각화
 * - 왼쪽/오른쪽 방향 판단 후 해당 방향 랜드마크만 표시
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';

import { usePoseLandmarks } from '@/app/camera/hooks/usePoseLandmarks';
import { poseLandmarker } from '@/app/camera/utils/frame-processors';
import {
    transformPoint,
    type CameraLayout
} from '@/app/camera/utils/pose-utils';

// 고도화된 방향 판단 함수 (x, z 좌표 모두 활용)
function getAdvancedSideDirection(landmarks: any[]): 'left' | 'right' | null {
  if (!landmarks || landmarks.length < 33) return null;
  
  // 어깨 랜드마크 (MediaPipe 인덱스)
  const leftShoulder = landmarks[11];  // left_shoulder
  const rightShoulder = landmarks[12]; // right_shoulder
  
  if (!leftShoulder || !rightShoulder) return null;
  
  // z값이 있는지 확인 (깊이 정보)
  const hasZValue = leftShoulder.z !== undefined && rightShoulder.z !== undefined;
  
  if (hasZValue) {
    // z값을 활용한 측면 방향 판단
    // z값이 더 큰 쪽이 카메라에서 더 멀리 있는 쪽 (측면)
    const leftZ = leftShoulder.z;
    const rightZ = rightShoulder.z;
    const zDiff = leftZ - rightZ;
    
    // x값도 함께 고려 (보조 지표)
    const leftX = leftShoulder.x;
    const rightX = rightShoulder.x;
    const xDiff = leftX - rightX;
    
    // z값 차이가 명확한 경우 (측면 자세)
    if (Math.abs(zDiff) > 0.1) {
      // 부호 반전: zDiff < 0이면 left가 더 멀리(즉, left 측면)
      return zDiff < 0 ? 'left' : 'right';
    }
    
    // z값 차이가 작은 경우 x값으로 판단 (정면 자세에서의 미세한 차이)
    if (Math.abs(xDiff) > 0.05) {
      return xDiff > 0 ? 'left' : 'right';
    }
  } else {
    // z값이 없는 경우 기존 x값 기준 판단
    const leftX = leftShoulder.x;
    const rightX = rightShoulder.x;
    
    if (Math.abs(leftX - rightX) > 0.05) {
      return leftX < rightX ? 'left' : 'right';
    }
  }
  
  return null;
}

// 추가: 측면 각도 계산 함수
function calculateSideAngle(landmarks: any[]): number | null {
  if (!landmarks || landmarks.length < 33) return null;
  
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  
  if (!leftShoulder || !rightShoulder) return null;
  
  // 어깨를 연결하는 선의 각도 계산
  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  return angle;
}

// CVA (Craniovertebral Angle) 계산 함수 - 귀-어깨 vs 수직 벡터 (벡터 방향 보정)
function calculateCVA(landmarks: any[], sideDirection: 'left' | 'right' | null): number | null {
  if (!landmarks || landmarks.length < 33 || !sideDirection) return null;
  
  // 측면에 따라 귀, 어깨 랜드마크 선택
  const earIndex = sideDirection === 'left' ? 3 : 4;  // LEFT_EAR(3) or RIGHT_EAR(4)
  const shoulderIndex = sideDirection === 'left' ? 11 : 12;  // LEFT_SHOULDER(11) or RIGHT_SHOULDER(12)
  
  const ear = landmarks[earIndex];
  const shoulder = landmarks[shoulderIndex];
  
  if (!ear || !shoulder) return null;
  
  // 수직 벡터 (0, 1) - 위쪽 방향
  const v1 = { x: 0.0, y: 1.0 };
  
  // 어깨→귀 벡터(항상 위쪽을 향하도록)
  const v2 = { 
    x: ear.x - shoulder.x, 
    y: ear.y - shoulder.y 
  };
  // 왼쪽 측면일 때는 방향 반전
  const v2fixed = sideDirection === 'left' ? { x: -v2.x, y: -v2.y } : v2;
  
  // 내적 계산
  const dot = v1.x * v2fixed.x + v1.y * v2fixed.y;
  
  // 벡터 크기 계산
  const norm1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const norm2 = Math.sqrt(v2fixed.x * v2fixed.x + v2fixed.y * v2fixed.y);
  
  // 각도 계산 (라디안 → 도)
  const angleRad = Math.acos(dot / (norm1 * norm2));
  const angleDeg = angleRad * 180 / Math.PI;
  
  return angleDeg;
}

// 거북목 판단 함수
function isTurtleNeck(cva: number | null): boolean {
  if (cva === null) return false;
  return cva < 50; // 50도 미만이면 거북목 의심
}

interface SidePoseDetectionModeProps {
  isActive: boolean;
}

export function SidePoseDetectionMode({ isActive }: SidePoseDetectionModeProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const [isReady, setIsReady] = useState(false);
  const [camLayout, setCamLayout] = useState<CameraLayout>({ x: 0, y: 0, width: 0, height: 0 });

  // Native Plugin Hook 활성화
  const { landmarks, frameWidth, frameHeight } = usePoseLandmarks();

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      // setIsActive(false); // This line is removed as per the new_code
    };
  }, []);

  // 진단용: landmarks 구조 출력 (최초 1회)
  React.useEffect(() => {
    if (landmarks) {
      // 1차원인지 2차원인지 확인
      // eslint-disable-next-line no-console
      console.log('landmarks 구조:', Array.isArray(landmarks) ? (Array.isArray(landmarks[0]) ? '2차원' : '1차원') : typeof landmarks, landmarks);
    }
  }, [landmarks]);

  // 실제 랜드마크 배열 추출 (1차원/2차원 모두 대응)
  const actualLandmarks = useMemo(() => {
    if (!landmarks) return [];
    if (Array.isArray(landmarks[0])) {
      // 2차원: [ [ {x, y, ...}, ... ] ]
      return (landmarks[0] || []) as any[];
    }
    // 1차원: [ {x, y, ...}, ... ]
    return landmarks as any[];
  }, [landmarks]);

  // 방향 판단 (왼쪽/오른쪽)
  const sideDirection = useMemo(() => getAdvancedSideDirection(actualLandmarks as any[]), [actualLandmarks]);
  
  // 측면 각도 계산
  const sideAngle = useMemo(() => calculateSideAngle(actualLandmarks as any[]), [actualLandmarks]);
  
  // CVA 계산
  const cva = useMemo(() => calculateCVA(actualLandmarks as any[], sideDirection), [actualLandmarks, sideDirection]);
  
  // 거북목 판단
  const isTurtle = useMemo(() => isTurtleNeck(cva), [cva]);
  
  // 디버깅: 방향 판단 결과 출력
  React.useEffect(() => {
    if (sideDirection && actualLandmarks.length > 0) {
      const leftShoulder = (actualLandmarks as any[])[11];
      const rightShoulder = (actualLandmarks as any[])[12];
      
      if (leftShoulder && rightShoulder) {
        console.log(`측면 방향: ${sideDirection}`);
        console.log(`측면 각도: ${sideAngle?.toFixed(1)}°`);
        console.log(`CVA: ${cva?.toFixed(1)}°`);
        console.log(`거북목 여부: ${isTurtle}`);
        console.log(`어깨 좌표 - 왼쪽: (${leftShoulder.x.toFixed(3)}, ${leftShoulder.y.toFixed(3)}, ${leftShoulder.z?.toFixed(3) || 'N/A'})`);
        console.log(`어깨 좌표 - 오른쪽: (${rightShoulder.x.toFixed(3)}, ${rightShoulder.y.toFixed(3)}, ${rightShoulder.z?.toFixed(3) || 'N/A'})`);
      }
    }
  }, [sideDirection, sideAngle, cva, isTurtle, actualLandmarks]);

  // 해당 방향의 랜드마크 인덱스만 남김
  const filteredLandmarks = useMemo(() => {
    if (!actualLandmarks || actualLandmarks.length === 0 || !sideDirection) return [];
    // MediaPipe/MoveNet 확장 인덱스 기준
    const leftIndices = [3, 11, 13, 15, 23, 25, 27];
    const rightIndices = [4, 12, 14, 16, 24, 26, 28];
    const baseIndices = [0];
    const indices = sideDirection === 'left' ? baseIndices.concat(leftIndices) : baseIndices.concat(rightIndices);
    // index 필드 포함
    return indices.map(idx => {
      const lm = (actualLandmarks as any[])[idx];
      return lm ? { ...lm, index: idx } : null;
    }).filter(Boolean);
  }, [actualLandmarks, sideDirection]);

  // 좌표 변환 (index 포함)
  const transformedLandmarks = useMemo(() => {
    if (!filteredLandmarks || filteredLandmarks.length === 0 || !camLayout.width || !camLayout.height) return [];
    return (filteredLandmarks as any[]).map((landmark) => {
      const point = transformPoint(
        { x: landmark.x, y: landmark.y },
        device?.position as 'front' | 'back' || 'front',
        camLayout,
        frameWidth,
        frameHeight
      );
      return {
        x: point.x,
        y: point.y,
        visibility: landmark.visibility,
        index: landmark.index
      };
    });
  }, [filteredLandmarks, camLayout, device?.position, frameWidth, frameHeight]);

  // 측면 연결선 정의 (MediaPipe 인덱스 기준)
  const sideConnections = useMemo(() => {
    // 연결선 정의: [start, end]
    const lines = sideDirection === 'left'
      ? [
          [0, 3], [3, 11], [11, 13], [13, 15], // 얼굴-어깨-팔
          [11, 23], [23, 25], [25, 27]         // 어깨-엉덩이-무릎-발목
        ]
      : [
          [0, 4], [4, 12], [12, 14], [14, 16],
          [12, 24], [24, 26], [26, 28]
        ];
    // filteredLandmarks의 index와 transformedLandmarks의 idx 매핑
    const idxMap: Record<number, number> = {};
    (filteredLandmarks as any[]).forEach((lm, i) => {
      idxMap[lm.index] = i;
    });
    // 실제 화면 좌표 연결선 생성
    return lines.map(([startIdx, endIdx]) => {
      const start = idxMap[startIdx];
      const end = idxMap[endIdx];
      if (start === undefined || end === undefined) return null;

      const startPoint = transformedLandmarks[start];
      const endPoint = transformedLandmarks[end];
      if (!startPoint || !endPoint) return null;
      
      // CVA 계산에 사용되는 귀-어깨 연결선만 검은색
      const isCVALine = ((startIdx === 3 || startIdx === 4) && (endIdx === 11 || endIdx === 12)); // ear to shoulder
      
      return {
        start: startPoint,
        end: endPoint,
        color: isCVALine ? '#000000' : '#888' // CVA 선은 검은색, 나머지는 회색
      };
    }).filter(Boolean);
  }, [filteredLandmarks, transformedLandmarks, sideDirection]);

  // 권한/카메라 준비
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (granted) setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, [hasPermission, requestPermission]);

  // Frame Processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      poseLandmarker(frame);
    } catch (error) {
      // 무시
    }
  }, []);

  if (!hasPermission || !device || !isReady) {
    return <View style={[styles.container, styles.centered]} />;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isReady}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          setCamLayout({ x, y, width, height });
        }}
      />
      {/* 방향별 랜드마크 및 연결선 시각화 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* 연결선 */}
        {sideConnections.map((line, idx) => {
          if (!line) return null;
          return (
            <View
              key={`line-${idx}`}
              style={{
                position: 'absolute',
                left: line.start.x,
                top: line.start.y,
                width: Math.sqrt(
                  Math.pow(line.end.x - line.start.x, 2) +
                  Math.pow(line.end.y - line.start.y, 2)
                ),
                height: 3,
                backgroundColor: line.color,
                borderRadius: 1.5,
                transform: [
                  {
                    rotate: `${Math.atan2(
                      line.end.y - line.start.y,
                      line.end.x - line.start.x
                    ) * 180 / Math.PI}deg`
                  }
                ],
                transformOrigin: '0 0',
                zIndex: 1
              }}
            />
          );
        })}
        {/* CVA(어깨-눈) 연결선: 항상 검은색으로 별도 표시 */}
        {(() => {
          if (!sideDirection || transformedLandmarks.length === 0) return null;
          const eyeIndex = sideDirection === 'left' ? 1 : 2;
          const shoulderIndex = sideDirection === 'left' ? 11 : 12;
          const eye = transformedLandmarks.find(p => p.index === eyeIndex);
          const shoulder = transformedLandmarks.find(p => p.index === shoulderIndex);
          if (!eye || !shoulder) return null;
          return (
            <View
              key="cva-black-line"
              style={{
                position: 'absolute',
                left: shoulder.x,
                top: shoulder.y,
                width: Math.sqrt(
                  Math.pow(eye.x - shoulder.x, 2) +
                  Math.pow(eye.y - shoulder.y, 2)
                ),
                height: 3,
                backgroundColor: '#000',
                borderRadius: 1.5,
                transform: [
                  {
                    rotate: `${Math.atan2(
                      eye.y - shoulder.y,
                      eye.x - shoulder.x
                    ) * 180 / Math.PI}deg`
                  }
                ],
                transformOrigin: '0 0',
                zIndex: 2
              }}
            />
          );
        })()}
        {/* 랜드마크 포인트 */}
        {transformedLandmarks.map((point, idx) => {
          const landmarkIndex = point.index;
          const isLegLandmark = landmarkIndex >= 25 && landmarkIndex <= 28; // 다리
          const isHipLandmark = landmarkIndex === 23 || landmarkIndex === 24; // 엉덩이
          const isEarLandmark = landmarkIndex === 3 || landmarkIndex === 4; // 귀
          const isShoulderLandmark = landmarkIndex === 11 || landmarkIndex === 12; // 어깨

          return (
            <View
              key={idx}
              style={[
                styles.posePoint,
                {
                  top: point.y - 6,
                  left: point.x - 6,
                  backgroundColor: isLegLandmark ? '#FFD700' : // 다리: 금색
                                   isHipLandmark ? '#32CD32' : // 엉덩이: 초록색
                                   isEarLandmark ? '#FF6B6B' : // 귀: 빨간색
                                   isShoulderLandmark ? '#4ECDC4' : // 어깨: 청록색
                                   sideDirection === 'left' ? '#4ECDC4' : '#FF6B6B',
                  opacity: point.visibility ? Math.max(point.visibility, 0.7) : 0.9,
                  zIndex: 2
                }
              ]}
            />
          );
        })}
      </View>
      {/* 거북이 이모티콘: 거북목일 때만 왼쪽 위에 고정 */}
      {isTurtle && (
        <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 20 }}>
          <Text style={{ fontSize: 28 }}>🐢</Text>
        </View>
      )}
      {/* 측면 모드 표시 배너 */}
      <View style={styles.sideBanner}>
        <Text style={styles.sideBannerText}>
          측면 포즈 감지 모드 {sideDirection ? `(${sideDirection === 'left' ? '좌측면' : '우측면'})` : ''}
        </Text>
        {cva && (
          <Text style={styles.cvaText}>
            CVA: {cva.toFixed(1)}° {isTurtle ? '🐢' : '✅'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  posePoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  sideBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  sideBannerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cvaText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
}); 