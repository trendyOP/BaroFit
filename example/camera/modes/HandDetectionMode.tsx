// HandDetectionMode.tsx
// Hand landmark detection using MediaPipe hand_landmarker.task
// Download model: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
// Place in assets/models/hand_landmarker.task

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  // VisionCameraProxy,
  // Frame,
  // useFrameProcessor,
} from 'react-native-vision-camera';

// 임시로 네이티브 플러그인 관련 코드 비활성화
// let plugin: any = null;
// let isInitialized = false;

// function initializeHandLandmarksPlugin() {
//   if (isInitialized) return plugin;
//   
//   try {
//     plugin = VisionCameraProxy.initFrameProcessorPlugin('handLandmarks', {});
//     isInitialized = true;
//     
//     if (plugin == null) {
//       console.error('Failed to initialize handLandmarks frame processor plugin');
//     } else {
//       console.log('Successfully initialized handLandmarks frame processor plugin');
//     }
//   } catch (error) {
//     console.error('Error initializing handLandmarks frame processor plugin:', error);
//     plugin = null;
//   }
//   
//   return plugin;
// }

// export function handLandmarks(frame: Frame) {
//   'worklet';
//   
//   const currentPlugin = initializeHandLandmarksPlugin();
//   
//   if (currentPlugin == null) {
//     console.warn('handLandmarks plugin not available');
//     return [];
//   }
//   
//   try {
//     return currentPlugin.call(frame);
//   } catch (error) {
//     console.error('Error in handLandmarks:', error);
//     return [];
//   }
// }

function HandDetectionMode(): React.JSX.Element {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [handData, setHandData] = useState<any[]>([]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // 임시로 프레임 프로세서 비활성화
  // const frameProcessor = useFrameProcessor(frame => {
  //   'worklet';
  //   try {
  //     const data = handLandmarks(frame);
  //     // runOnJS를 사용하여 상태 업데이트
  //     if (data && Array.isArray(data)) {
  //       // 간단한 상태 업데이트 (실제 구현에서는 runOnJS 사용)
  //       // setHandData(data);
  //     }
  //   } catch (error) {
  //     console.error('Hand detection frame processor error:', error);
  //   }
  // }, []);

  if (!hasPermission) return <Text style={styles.text}>No permission</Text>;
  if (device == null) return <Text style={styles.text}>No device</Text>;

  return (
    <View style={styles.container}>
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
        // frameProcessor={frameProcessor}
      fps={30}
      pixelFormat="rgb"
    />
      
      {/* 임시로 정적 정보 표시 */}
      <View style={styles.overlay}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Hand Detection Test</Text>
          <Text style={styles.infoText}>Camera: {device.position}</Text>
          <Text style={styles.infoText}>Status: Camera Only (No Processing)</Text>
          <Text style={styles.infoText}>Native plugins temporarily disabled</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default HandDetectionMode; 