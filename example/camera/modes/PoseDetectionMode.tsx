/**
 * app/camera/modes/PoseDetectionMode.tsx
 * 
 * MoveNet을 사용한 실제 포즈 감지 카메라 모드
 * - 방향별 포즈 분석
 * - 실시간 자세 점수 및 피드백
 * - 결과 캐시 저장
 */
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor, useCameraPermission } from 'react-native-vision-camera';

import { usePoseLandmarks } from '~/hooks/usePoseLandmarks';
import { useBodyOrientation } from '~/hooks/useBodyOrientation';
import { usePoseAnalysis } from '~/hooks/usePoseAnalysis';
import { usePoseResultCache } from '~/hooks/usePoseResultCache';
import { poseLandmarker } from '~/app/camera/utils/frame-processors';
import { 
  transformPoint,
  generatePoseConnections,
  getLandmarkColor,
  type CameraLayout
} from '~/app/camera/utils/pose-utils';
import { BodyOrientationSelector } from '~/app/camera/components/BodyOrientationSelector';
import { PoseFeedbackOverlay } from '~/app/camera/components/PoseFeedbackOverlay';

export function PoseDetectionMode() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const [isReady, setIsReady] = useState(false);
  const [camLayout, setCamLayout] = useState<CameraLayout>({ x: 0, y: 0, width: 0, height: 0 });

  // 방향 선택 훅
  const { orientation, changeOrientation, getOrientationLabel } = useBodyOrientation();

  // Native Plugin Hook 활성화
  const { landmarks, frameWidth, frameHeight } = usePoseLandmarks();
  
  // 포즈 분석 훅
  const analysis = usePoseAnalysis(landmarks, orientation, device?.position as 'front' | 'back' || 'front');
  
  // 결과 캐시 저장 훅
  const { saveResult, startAutoSave, stopAutoSave } = usePoseResultCache();
  
  // 정확한 좌표 변환된 랜드마크 계산
  const transformedLandmarks = useMemo(() => {
    if (!landmarks || landmarks.length === 0 || !camLayout.width || !camLayout.height) {
      return [];
    }
    
    // 첫 번째 포즈만 사용 (여러 사람이 감지될 수 있음)
    const firstPose = landmarks[0];
    if (!firstPose) return [];
    
    // 새로운 transformPoint 함수로 정확한 좌표 변환
    const transformed = firstPose.map((landmark, index) => {
      const point = transformPoint(
        { x: landmark.x, y: landmark.y },
        device?.position as 'front' | 'back' || 'front',
        camLayout
      );
      
      return {
        x: point.x,
        y: point.y,
        visibility: landmark.visibility
      };
    });
    
    return transformed;
  }, [landmarks, camLayout, device?.position]);

  // 연결선 생성
  const poseConnections = useMemo(() => {
    return generatePoseConnections(transformedLandmarks);
  }, [transformedLandmarks]);

  // Request camera permission if not granted
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().then((granted) => {
        if (granted) {
          setIsReady(true);
        }
      });
    } else {
      setIsReady(true);
    }
  }, [hasPermission, requestPermission]);

  // 포즈 분석 결과가 있을 때 캐시에 저장
  useEffect(() => {
    if (landmarks && landmarks.length > 0 && analysis.postureScore > 0) {
      // 실시간 저장 시작
      startAutoSave(orientation, analysis, landmarks);
      
    return () => {
        stopAutoSave();
      };
    }
  }, [landmarks, analysis, orientation, startAutoSave, stopAutoSave]);

  // Frame Processor
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const result = poseLandmarker(frame);
    } catch (error) {
      console.error('❌ Frame processor error:', JSON.stringify(error));
    }
  }, []);

  // Show loading state while permissions are being requested
  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>카메라 권한을 요청하는 중...</Text>
      </View>
    );
  }

  // Show error if no camera device is available
  if (!device) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>카메라를 사용할 수 없습니다.</Text>
      </View>
    );
  }

  // Show loading state while camera is initializing
  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.text}>카메라를 초기화하는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          setCamLayout({ x, y, width, height });
        }}
      />
      
      {/* 방향 선택 UI */}
      {/**
      <BodyOrientationSelector
        orientation={orientation}
        onOrientationChange={changeOrientation}
      />
      */}
      
      {/* 포즈 피드백 오버레이 */}
      <PoseFeedbackOverlay
        analysis={analysis}
        landmarks={landmarks}
        camLayout={camLayout}
        devicePosition={device?.position as 'front' | 'back' || 'front'}
      />
      
      {/* 보정된 Pose 랜드마크 시각화 */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* 연결선 렌더링 */}
        {poseConnections.map((line, index) => (
          <View
            key={`line-${index}`}
            style={[
              styles.connectionLine,
              {
                position: 'absolute',
                left: line.start.x,
                top: line.start.y,
                width: Math.sqrt(
                  Math.pow(line.end.x - line.start.x, 2) + 
                  Math.pow(line.end.y - line.start.y, 2)
                ),
                height: 2,
                backgroundColor: line.color,
                transform: [
                  {
                    rotate: `${Math.atan2(
                      line.end.y - line.start.y,
                      line.end.x - line.start.x
                    ) * 180 / Math.PI}deg`
                  }
                ],
                transformOrigin: '0 0'
              }
            ]}
          />
        ))}
        
        {/* 랜드마크 포인트 렌더링 */}
        {transformedLandmarks.length > 0 ? (
          transformedLandmarks.map((point, index) => (
            <View
              key={index}
              style={[
                styles.posePoint,
                {
                  top: point.y - 4,
                  left: point.x - 4,
                  backgroundColor: getLandmarkColor(index),
                  opacity: point.visibility ? Math.max(point.visibility, 0.6) : 0.8
                }
              ]}
            />
          ))
        ) : (
          <View style={[styles.posePoint, { top: 100, left: 180, backgroundColor: 'orange' }]} />
          )}
        </View>
        
      {/* 카메라 전환 버튼 */}
      <TouchableOpacity
        style={styles.cameraSwitchButtonMiddle}
        onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
      >
        <Text style={styles.cameraSwitchText}>
          {cameraPosition === 'front' ? '후면' : '전면'}
        </Text>
      </TouchableOpacity>
      
      {/* 현재 방향 표시 */}
      {/**
      <View style={styles.orientationDisplay}>
        <Text style={styles.orientationText}>
          현재 방향: {getOrientationLabel(orientation)}
              </Text>
      </View>*/}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
  posePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  cameraSwitchButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  cameraSwitchButtonMiddle: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
    zIndex: 20,
  },
  cameraSwitchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orientationDisplay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  orientationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});