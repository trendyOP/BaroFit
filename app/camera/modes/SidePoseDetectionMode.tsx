/**
 * app/camera/modes/SidePoseDetectionMode.tsx
 * 
 * 측면 포즈 감지 전용 카메라 모드 (최소화 버전)
 * - UI 요소 제거, 랜드마크만 시각화
 * - 왼쪽/오른쪽 방향 판단 후 해당 방향 랜드마크만 표시
 */
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';

import { useBodyOrientation } from '@/app/camera/hooks/useBodyOrientation';
import { usePoseAnalysis } from '@/app/camera/hooks/usePoseAnalysis';
import { usePoseLandmarks } from '@/app/camera/hooks/usePoseLandmarks';
import { poseLandmarker } from '@/app/camera/utils/frame-processors';
import {
  transformPoint,
  type CameraLayout
} from '@/app/camera/utils/pose-utils';
import { usePoseData } from '@/contexts/PoseDataContext';
import { useSettings } from '@/contexts/SettingsContext';

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
  router?: any;
  showFeedback?: string | string[];
}

export function SidePoseDetectionMode({ isActive, router, showFeedback }: SidePoseDetectionModeProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const [isReady, setIsReady] = useState(false);
  const [camLayout, setCamLayout] = useState<CameraLayout>({ x: 0, y: 0, width: 0, height: 0 });
  const { addPoseData } = usePoseData();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const { settings } = useSettings(); // SettingsContext에서 설정 가져오기
  const defaultRouter = useRouter();
  const currentRouter = router || defaultRouter;



  // Native Plugin Hook 활성화
  const { landmarks, frameWidth, frameHeight } = usePoseLandmarks();
  const { orientation } = useBodyOrientation();
  const analysis = usePoseAnalysis(landmarks, orientation, device?.position as 'front' | 'back' || 'back');

  // 최신 analysis 값을 저장하는 ref  
  const analysisRef = useRef(analysis);
  analysisRef.current = analysis; // 매번 최신값으로 업데이트

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
  
  // 진동 및 소리 인터벌 ID를 저장하는 ref
  const feedbackIntervalRef = useRef<number | null>(null);



  // 사운드 로딩
  useEffect(() => {
    let isMounted = true;
    async function loadSound() {
      console.log('사운드 로딩 시작');
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('@/assets/sounds/alert.mp3') // mp3로 변경
        );
        if (isMounted) {
          setSound(sound);
          console.log('사운드 로딩 완료');
        }
      } catch (error) {
        console.error('사운드 로딩 실패:', error);
      }
    }

    loadSound();

    return () => {
      isMounted = false;
      console.log('사운드 언로딩');
      sound?.unloadAsync(); 
    };
  }, []);

  // 1초마다 현재 자세 분석 결과를 Context로 보냄
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      const currentAnalysis = analysisRef.current; // ref에서 최신값 가져오기
      if (currentAnalysis && typeof currentAnalysis.postureScore === 'number') {
        console.log('[측면] 1초마다 자세 데이터 저장:', currentAnalysis.postureScore);
        addPoseData(currentAnalysis);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, addPoseData]); // addPoseData도 의존성에 추가

  // 거북목 감지 시 진동 및 소리 피드백
  useEffect(() => {
    async function playSound() {
      if (sound) {
        try {
          await sound.replayAsync();
        } catch (error) {
          console.error('사운드 재생 실패:', error);
        }
      }
    }

    // 카메라가 비활성화 상태이면 피드백 중지
    if (!isActive) {
      if (feedbackIntervalRef.current) {
        clearInterval(feedbackIntervalRef.current);
        feedbackIntervalRef.current = null;
        console.log('카메라 비활성화. 피드백 중지');
      }
      return;
    }
    
    // isTurtle 상태에 따라 피드백 제어
    if (isTurtle) {
      // 거북목 상태이고, 피드백이 현재 울리고 있지 않으면 시작
      if (feedbackIntervalRef.current === null) {
        if (settings.hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        if (settings.soundEnabled) {
          playSound();
        }
        console.log('거북목 감지! 피드백 시작');
        feedbackIntervalRef.current = setInterval(() => {
          if (settings.hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          if (settings.soundEnabled) {
            playSound();
          }
          console.log('거북목 지속 중! 피드백');
        }, 1000); 
      }
    } else {
      // 거북목 상태가 아니고, 피드백이 현재 울리고 있으면 중지
      if (feedbackIntervalRef.current !== null) {
        clearInterval(feedbackIntervalRef.current);
        feedbackIntervalRef.current = null;
        console.log('거북목 해소. 피드백 중지');
      }
    }

    // 클린업 함수: 컴포넌트 언마운트 시 피드백 중지
    return () => {
      if (feedbackIntervalRef.current !== null) {
        clearInterval(feedbackIntervalRef.current);
        feedbackIntervalRef.current = null;
      }
    };
  }, [isActive, isTurtle, sound, settings.hapticsEnabled, settings.soundEnabled]); // 설정 변경 시 반응하도록 의존성 추가

  // 진단용: landmarks 구조 출력 (최초 1회)
  React.useEffect(() => {
    if (landmarks) {
      // 1차원인지 2차원인지 확인
      // eslint-disable-next-line no-console
      console.log('landmarks 구조:', Array.isArray(landmarks) ? (Array.isArray(landmarks[0]) ? '2차원' : '1차원') : typeof landmarks, landmarks);
    }
  }, [landmarks]);

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

  // 변환된 랜드마크 필터링 (측면 방향에 따라 관련 랜드마크만 선택)
  const filteredLandmarks = useMemo(() => {
    if (!actualLandmarks || actualLandmarks.length === 0 || !sideDirection) return [];
    // MediaPipe/MoveNet 확장 인덱스 기준
    const leftIndices = [3, 11, 23, 25, 27]; // LEFT_EAR, LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE
    const rightIndices = [4, 12, 24, 26, 28]; // RIGHT_EAR, RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE
    const baseIndices = [0]; // NOSE
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

  // 측면 연결선 정의
  const sideConnections = useMemo(() => {
    if (!sideDirection) return [];

    const lines = sideDirection === 'left'
      ? [
          [0, 3], [3, 11],
          [11, 23], [23, 25], [25, 27]
        ]
      : [
          [0, 4], [4, 12],
          [12, 24], [24, 26], [26, 28]
        ];

    const idxMap: Record<number, number> = {};
    (filteredLandmarks as any[]).forEach((lm, i) => {
      idxMap[lm.index] = i;
    });
    
    const problemConnections = sideDirection === 'left' ? ['3-11', '11-23'] : ['4-12', '12-24'];

    return lines.map(([startIdx, endIdx]) => {
      const start = idxMap[startIdx];
      const end = idxMap[endIdx];
      if (start === undefined || end === undefined) return null;

      const startPoint = transformedLandmarks[start];
      const endPoint = transformedLandmarks[end];
      if (!startPoint || !endPoint) return null;
      
      const connectionKey = `${Math.min(startIdx, endIdx)}-${Math.max(startIdx, endIdx)}`;
      const isProblemConnection = isTurtle && problemConnections.includes(connectionKey);
      
      return {
        start: startPoint,
        end: endPoint,
        color: isProblemConnection ? '#FF6B6B' : '#87CEEB'
      };
    }).filter(Boolean);
  }, [filteredLandmarks, transformedLandmarks, sideDirection, isTurtle]);

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

  // 현재 자세 점수를 가져오는 로직
  const currentScore = useMemo(() => {
    if (!analysis) return 0;
    return analysis.postureScore || 0;
  }, [analysis]);

  // 실시간 피드백 오버레이 상태 관리
  const showFeedbackOverlay = showFeedback === 'true';

  if (!hasPermission || !device || !isReady) {
    return <View style={[styles.container, styles.centered]} />;
  }

  return (
    <View style={[styles.container, showFeedbackOverlay ? styles.containerWithFeedback : styles.containerWithoutFeedback]}>
      {showFeedbackOverlay ? (
        // 실시간 피드백이 켜져있을 때: 메인 컨텐츠가 위, 카메라가 아래
        <>
          {/* 메인 컨텐츠 영역 - 맨 위 */}
          <View style={styles.mainContentTop}>
            {/* 상단 점수 및 후면 버튼 */}
            <View style={styles.topRow}>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>자세 점수 : {currentScore} 점</Text>
              </View>
              <TouchableOpacity 
                style={styles.rearButton}
                onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.rearButtonText}>후면</Text>
              </TouchableOpacity>
            </View>

            {/* 측면 분석 정보 영역 */}
            <View style={styles.contentRow}>
              <View style={styles.analysisContainer}>
                <Text style={styles.sectionTitle}>측면 분석</Text>
                <View style={styles.analysisContentBox}>
                  <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    <Text style={styles.analysisText}>
                      측면 포즈 감지 모드 {sideDirection ? `(${sideDirection === 'left' ? '좌측면' : '우측면'})` : ''}
                    </Text>
                    {cva && (
                      <Text style={styles.cvaText}>
                        CVA: {cva.toFixed(1)}° {isTurtle ? '🐢' : '✅'}
                      </Text>
                    )}
                    {sideAngle && (
                      <Text style={styles.angleText}>
                        측면 각도: {sideAngle.toFixed(1)}°
                      </Text>
                    )}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <Text style={styles.sectionTitle}>상태</Text>
                <View style={styles.statusContentBox}>
                  <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {isTurtle ? (
                      <Text style={styles.warningText}>• 거북목 감지됨</Text>
                    ) : (
                      <Text style={styles.normalText}>• 정상 자세</Text>
                    )}
                    <Text style={styles.statusText}>
                      • 방향: {sideDirection ? (sideDirection === 'left' ? '좌측면' : '우측면') : '감지 중'}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* 하단 정면 자세 감지로 전환 버튼 */}
            <TouchableOpacity 
              style={styles.detectionButton}
              onPress={() => {
                currentRouter.push({
                  pathname: '/(tabs)/front-pose-detection',
                  params: { showFeedback },
                });
              }}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.detectionButtonText}>정면 자세 감지로 전환</Text>
            </TouchableOpacity>
          </View>

          {/* 카메라 영역 - 아래쪽 */}
          <View style={styles.cameraContainer}>
            <Camera
              style={styles.camera}
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
              
              {/* 랜드마크 포인트 */}
              {transformedLandmarks.map((point, idx) => {
                const landmarkIndex = point.index;
                
                const problemLandmarks = sideDirection === 'left' ? [3, 11, 23] : [4, 12, 24]; // 귀, 어깨, 골반
                const isProblemLandmark = isTurtle && problemLandmarks.includes(landmarkIndex);

                return (
                  <View
                    key={idx}
                    style={[
                      styles.posePoint,
                      {
                        top: point.y - 6,
                        left: point.x - 6,
                        backgroundColor: isProblemLandmark ? '#FF6B6B' : '#87CEEB',
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
              <View style={{ position: 'absolute', left: 24, top: 50, zIndex: 20 }}>
                <Image source={require('@/assets/images/tutleneck-icon.png')} style={{ width: 60, height: 60 }} />
              </View>
            )}
          </View>
        </>
      ) : (
        // 실시간 피드백이 꺼져있을 때: 전체 화면 카메라
        <>
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
            
            {/* 랜드마크 포인트 */}
            {transformedLandmarks.map((point, idx) => {
              const landmarkIndex = point.index;
              
              const problemLandmarks = sideDirection === 'left' ? [3, 11, 23] : [4, 12, 24]; // 귀, 어깨, 골반
              const isProblemLandmark = isTurtle && problemLandmarks.includes(landmarkIndex);

              return (
                <View
                  key={idx}
                  style={[
                    styles.posePoint,
                    {
                      top: point.y - 6,
                      left: point.x - 6,
                      backgroundColor: isProblemLandmark ? '#FF6B6B' : '#87CEEB',
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
            <View style={{ position: 'absolute', left: 24, top: 120, zIndex: 20 }}>
              <Image source={require('@/assets/images/tutleneck-icon.png')} style={{ width: 60, height: 60 }} />
            </View>
          )}
          {/* 측면 모드 표시 배너 */}
          {/*
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
          */}
          {/* 후면 카메라 전환 버튼 - 우상단 */}
          <TouchableOpacity
            style={styles.rearCameraButton}
            onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.rearCameraButtonText}>
              {cameraPosition === 'front' ? '후면' : '전면'}
            </Text>
          </TouchableOpacity>

          {/* 정면 모드로 전환 버튼 - 좌상단 */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              currentRouter.push({
                pathname: '/(tabs)/front-pose-detection',
                params: { showFeedback },
              });
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.switchButtonText}>정면 자세 감지로 전환</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerWithFeedback: {
    backgroundColor: '#F2F2F7',
  },
  containerWithoutFeedback: {
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
    fontSize: 12,
    color: '#4ECDC4',
    marginBottom: 4,
  },
  rearCameraButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 10,
  },
  rearCameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  switchButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    zIndex: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainContentTop: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  rearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  analysisContainer: {
    flex: 1,
  },
  analysisContentBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    height: 100,
    borderColor: '#4ECDC4',
  },
  scrollView: {
    flex: 1,
  },
  analysisText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginBottom: 4,
  },
  angleText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginBottom: 4,
  },
  statusContainer: {
    flex: 1,
  },
  statusContentBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    height: 100,
    borderColor: '#FF6B6B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  normalText: {
    fontSize: 12,
    color: '#34C759',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 4,
  },
  detectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 12,
  },
  detectionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    marginTop: 3,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 300,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },

}); 