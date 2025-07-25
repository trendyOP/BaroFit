import type { Frame } from 'react-native-vision-camera';
import { VisionCameraProxy } from 'react-native-vision-camera';

// Initialize the Frame Processor Plugin
const poseLandMarkPlugin = VisionCameraProxy.initFrameProcessorPlugin("poseLandmarks", {});

/**
 * Pose Landmarker Frame Processor
 * 
 * @param frame Camera frame from VisionCamera
 * @returns Processing result (typically null as results are sent via events)
 */
export function poseLandmarker(frame: Frame): any {
  'worklet';
  
  if (poseLandMarkPlugin == null) {
    console.error("Failed to load Frame Processor Plugin!");
    throw new Error("Failed to load Frame Processor Plugin!");
  }
  
  const result = poseLandMarkPlugin.call(frame);
  return result;
} 