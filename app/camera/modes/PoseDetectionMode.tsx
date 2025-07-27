import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Line, Svg } from "react-native-svg";
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';

import { PoseFeedbackOverlay } from '@/app/camera/components/PoseFeedbackOverlay';
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

interface PoseDetectionModeProps {
  isActive: boolean;
  showFeedbackOverlay?: boolean;
}

export function PoseDetectionMode({ isActive, showFeedbackOverlay = true }: PoseDetectionModeProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const [isReady, setIsReady] = useState(false);
  const [camLayout, setCamLayout] = useState<CameraLayout>({ x: 0, y: 0, width: 0, height: 0 });

  // 카메라 및 포즈 감지 훅
  const { landmarks, frameWidth, frameHeight } = usePoseLandmarks();
  const { orientation, changeOrientation, getOrientationLabel } = useBodyOrientation();
  const analysis = usePoseAnalysis(landmarks, orientation, device?.position as 'front' | 'back' || 'back');

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      // setIsActive(false); // This line is removed as per the new_code
    };
  }, []);

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

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isReady}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        onLayout={(event) => setCamLayout(event.nativeEvent.layout)}
      />
      
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
      
      <PoseFeedbackOverlay
        analysis={analysis}
        landmarks={landmarks}
        camLayout={camLayout}
        devicePosition={device?.position as 'front' | 'back' || 'front'}
        frameWidth={frameWidth}
        frameHeight={frameHeight}
        showDetails={showFeedbackOverlay}
      />

      <TouchableOpacity
        style={styles.cameraSwitchButton}
        onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
      >
        <Text style={styles.cameraSwitchText}>
          {cameraPosition === 'front' ? '후면' : '전면'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  cameraSwitchButton: {
    position: 'absolute',
    right: 20,
    top: 60,
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
}); 