import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Line, Svg } from "react-native-svg";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';

import { useBodyOrientation } from '@/app/camera/hooks/useBodyOrientation';
import { usePoseAnalysis } from '@/app/camera/hooks/usePoseAnalysis';
import { usePoseLandmarks } from '@/app/camera/hooks/usePoseLandmarks';
import { poseLandmarker } from '@/app/camera/utils/frame-processors';
import {
  generatePoseConnections,
  getConnectionColor,
  getLandmarkColor,
  transformPoint,
  type CameraLayout
} from '@/app/camera/utils/pose-utils';
import { usePoseData } from '@/contexts/PoseDataContext';

interface PoseDetectionModeProps {
  isActive: boolean;
  showFeedbackOverlay?: boolean;
  router?: any;
  showFeedback?: string | string[];
}

export function PoseDetectionMode({ isActive, showFeedbackOverlay = true, router, showFeedback }: PoseDetectionModeProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const [isReady, setIsReady] = useState(false);
  const [camLayout, setCamLayout] = useState<CameraLayout>({ x: 0, y: 0, width: 0, height: 0 });
  const defaultRouter = useRouter(); // Use default router if not passed as prop
  const currentRouter = router || defaultRouter;



  // 카메라 및 포즈 감지 훅
  const { landmarks, frameWidth, frameHeight } = usePoseLandmarks();
  const { orientation, changeOrientation, getOrientationLabel } = useBodyOrientation();
  const analysis = usePoseAnalysis(landmarks, orientation, device?.position as 'front' | 'back' || 'back');
  const { addPoseData } = usePoseData();

  // 최신 analysis 값을 저장하는 ref
  const analysisRef = useRef(analysis);
  analysisRef.current = analysis; // 매번 최신값으로 업데이트



  // 1초마다 현재 자세 분석 결과를 Context로 보냄
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      const currentAnalysis = analysisRef.current; // ref에서 최신값 가져오기
      if (currentAnalysis && typeof currentAnalysis.postureScore === 'number') {
        console.log('1초마다 자세 데이터 저장:', currentAnalysis.postureScore);
        addPoseData(currentAnalysis);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, addPoseData]);

  // 정확한 좌표 변환된 랜드마크 계산
  const transformedLandmarks = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !camLayout.width || !camLayout.height) {
      return [];
    }
    
    const firstPose = landmarks[0];
    if (!firstPose) return [];
    
    const transformed = firstPose.map((landmark: any, index: number) => {
      const point = transformPoint(
        { x: landmark.x, y: landmark.y },
        device?.position as 'front' | 'back' || 'front',
        camLayout,
        frameWidth,
        frameHeight
      );
      
      return {
        ...point,
        visibility: landmark.visibility,
        index
      };
    });
    
    return transformed;
  }, [landmarks, camLayout, device?.position, frameWidth, frameHeight]);

  // 연결선 생성
  const poseConnections = useMemo(() => {
    return generatePoseConnections(transformedLandmarks);
  }, [transformedLandmarks]);

  // 문제가 있는 연결선 계산 (오버레이 원의 색상 기반)
  const problematicConnections = useMemo(() => {
    const problematic: string[] = [];
    
    if (analysis?.kinematicChain) {
      const { shoulder, pelvic } = analysis.kinematicChain;
      
      // 어깨 대칭 문제가 있고 빨간색 원이 표시될 때만 연결선을 빨간색으로
      const hasShoulderIssue = analysis.shoulderSymmetry < 80 || shoulder.issues.length > 0;
      const shoulderIsRed = hasShoulderIssue && analysis.shoulderSymmetry < 80;
      
      if (shoulderIsRed) {
        problematic.push('11-12'); // LEFT_SHOULDER - RIGHT_SHOULDER
      }
      
      // 골반 문제가 있고 빨간색 원이 표시될 때만 연결선을 빨간색으로
      const hasPelvicIssue = !pelvic.isLevel || pelvic.issues.length > 0;
      const pelvicIsRed = hasPelvicIssue && !pelvic.isLevel;
      
      if (pelvicIsRed) {
        problematic.push('23-24'); // LEFT_HIP - RIGHT_HIP
      }
    }
    
    return problematic;
  }, [analysis]);

  // 연결선 색상 결정 함수
  const getConnectionColorWithAnalysis = (startIndex: number, endIndex: number) => {
    const connectionKey = `${Math.min(startIndex, endIndex)}-${Math.max(startIndex, endIndex)}`;
    
    if (problematicConnections.includes(connectionKey)) {
      return '#FF6B6B'; // 문제가 있는 연결선만 빨간색
    }
    
    return getConnectionColor(startIndex, endIndex);
  };



  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (granted) setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, [hasPermission, requestPermission]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      poseLandmarker(frame);
    } catch (error) {
      console.error('❌ Frame processor error:', JSON.stringify(error));
    }
  }, []);

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>{!hasPermission ? "카메라 권한이 필요합니다." : "카메라를 사용할 수 없습니다."}</Text>
      </View>
    );
  }

  const currentScore = analysis?.postureScore ? Math.round(analysis.postureScore) : 0;
  const currentIssues = analysis?.issues || [];
  const currentRecommendations = analysis?.recommendations || [];

  return (
    <View style={styles.container}>
      {showFeedbackOverlay ? (
        // 실시간 피드백이 켜져있을 때: 메인 컨텐츠가 위, 카메라가 아래쪽
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
                <Text style={styles.rearButtonText}>
                  {cameraPosition === 'front' ? '후면' : '전면'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 발견된 문제 및 권장사항 영역 */}
            <View style={styles.contentRow}>
              <View style={styles.issuesContainer}>
                <Text style={styles.sectionTitle}>발견된 문제</Text>
                <View style={styles.issuesContentBox}>
                  <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {currentIssues.length > 0 ? (
                      currentIssues.map((issue, index) => (
                        <Text key={index} style={styles.issueText}>• {issue}</Text>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>문제가 발견되지 않았습니다</Text>
                    )}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.recommendationsContainer}>
                <Text style={styles.sectionTitle}>권장사항</Text>
                <View style={styles.recommendationsContentBox}>
                  <ScrollView 
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {currentRecommendations.length > 0 ? (
                      currentRecommendations.map((rec, index) => (
                        <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>권장사항이 없습니다</Text>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* 하단 측면 자세 감지로 전환 버튼 */}
            <TouchableOpacity 
              style={styles.detectionButton}
              onPress={() => {
                currentRouter.push({
                  pathname: '/(tabs)/side-pose-detection',
                  params: { showFeedback },
                });
              }}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.detectionButtonText}>측면 자세 감지로 전환</Text>
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
              onLayout={(event) => setCamLayout(event.nativeEvent.layout)}
            />
            
            {/* 포즈 랜드마크 오버레이 */}
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              {poseConnections.map((line: any, index: number) => (
                <Line
                  key={`line-${index}`}
                  x1={line.start.x}
                  y1={line.start.y}
                  x2={line.end.x}
                  y2={line.end.y}
                  stroke={getConnectionColorWithAnalysis(line.startIndex, line.endIndex)}
                  strokeWidth={3}
                />
              ))}
              {transformedLandmarks.map((point: any, index: number) => {
                // 얼굴 랜드마크 (인덱스 0-10)는 그리지 않음
                if (point.index >= 0 && point.index <= 10) {
                  return null;
                }
                return (
                  <Circle
                    key={`circle-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    fill={getLandmarkColor(point.index)}
                    stroke="white"
                    strokeWidth={1}
                    opacity={point.visibility ? Math.max(point.visibility, 0.6) : 0.8}
                  />
                );
              })}
            </Svg>



            {/* 경고 아이콘 오버레이 */}
            {analysis?.kinematicChain && (
              <>
                {/* 어깨 대칭 문제 경고 아이콘 */}
                {analysis.shoulderSymmetry < 80 && (() => {
                  // 어깨 랜드마크 찾기 (LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12)
                  const leftShoulder = transformedLandmarks.find((p: any) => p.index === 11);
                  const rightShoulder = transformedLandmarks.find((p: any) => p.index === 12);
                  const shoulderX = rightShoulder?.x || leftShoulder?.x || 0;
                  const shoulderY = rightShoulder?.y || leftShoulder?.y || 0;
                  
                  return (
                    <View style={[styles.warningIcon, { 
                      left: shoulderX + 20, 
                      top: shoulderY - 20 
                    }]}>
                      <Image 
                        source={require('@/assets/images/warning-icon.png')} 
                        style={styles.warningImage}
                      />
                    </View>
                  );
                })()}
                
                {/* 골반 대칭 문제 경고 아이콘 */}
                {!analysis.kinematicChain.pelvic.isLevel && (() => {
                  // 골반 랜드마크 찾기 (LEFT_HIP: 23, RIGHT_HIP: 24)
                  const leftHip = transformedLandmarks.find((p: any) => p.index === 23);
                  const rightHip = transformedLandmarks.find((p: any) => p.index === 24);
                  const hipX = rightHip?.x || leftHip?.x || 0;
                  const hipY = rightHip?.y || leftHip?.y || 0;
                  
                  return (
                    <View style={[styles.warningIcon, { 
                      left: hipX + 20, 
                      top: hipY - 20 
                    }]}>
                      <Image 
                        source={require('@/assets/images/warning-icon.png')} 
                        style={styles.warningImage}
                      />
                    </View>
                  );
                })()}
              </>
            )}
          </View>
        </>
      ) : (
        // 실시간 피드백이 꺼져있을 때: 전체 화면 카메라
        <>
          {/* 카메라 배경 */}
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive && isReady}
            frameProcessor={frameProcessor}
            pixelFormat="rgb"
            onLayout={(event) => setCamLayout(event.nativeEvent.layout)}
          />
          
          {/* 포즈 랜드마크 오버레이 */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            {poseConnections.map((line: any, index: number) => (
              <Line
                key={`line-${index}`}
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke={getConnectionColorWithAnalysis(line.startIndex, line.endIndex)}
                strokeWidth={3}
              />
            ))}
            {transformedLandmarks.map((point: any, index: number) => {
              // 얼굴 랜드마크 (인덱스 0-10)는 그리지 않음
              if (point.index >= 0 && point.index <= 10) {
                return null;
              }
              return (
                <Circle
                  key={`circle-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={6}
                  fill={getLandmarkColor(point.index)}
                  stroke="white"
                  strokeWidth={1}
                  opacity={point.visibility ? Math.max(point.visibility, 0.6) : 0.8}
                />
              );
            })}
          </Svg>

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

          {/* 측면 자세 감지로 전환 버튼 - 좌상단 */}
          <TouchableOpacity 
            style={styles.sideDetectionButton}
            onPress={() => {
              currentRouter.push({
                pathname: '/(tabs)/side-pose-detection',
                params: { showFeedback },
              });
            }}
          >
            <View style={styles.buttonIcon}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.detectionButtonText}>측면 자세 감지로 전환</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  mainContent: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
  issuesContainer: {
    flex: 1,
  },
  recommendationsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  issuesContentBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    height: 100,
    borderColor: '#FF6B6B',
  },
  recommendationsContentBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 10,
    height: 100,
    borderColor: '#34C759',
  },
  scrollView: {
    flex: 1,
  },
  issueText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#34C759',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 12,
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
  sideDetectionButton: {
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
  detectionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  warningImage: {
    width: 30,
    height: 30,
  },

}); 