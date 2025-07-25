import { useEffect, useState } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';

const { PoseLandmarks } = NativeModules;

// Define the structure of a single landmark point
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

// A pose is an array of landmarks
export type Pose = Landmark[];

export function usePoseLandmarks() {
  const [landmarks, setLandmarks] = useState<Pose[]>([]);
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    // Manually initialize the model when the hook is first used.
    if (PoseLandmarks?.initModel) {
      PoseLandmarks.initModel();
    }

    const errorListener = DeviceEventEmitter.addListener('onPoseLandmarksError', (event) => {
      console.error('PoseLandmarks Error:', event.error);
    });

    const statusListener = DeviceEventEmitter.addListener('onPoseLandmarksStatus', (event) => {
      console.log('PoseLandmarks Status:', event.status);
    });

    const landmarksListener = DeviceEventEmitter.addListener(
      'onPoseLandmarksDetected',
      (event: { landmarks: Pose[]; frameWidth: number; frameHeight: number }) => {
        setLandmarks(event.landmarks);
        setFrameWidth(event.frameWidth);
        setFrameHeight(event.frameHeight);
      },
    );

    return () => {
      errorListener.remove();
      statusListener.remove();
      landmarksListener.remove();
    };
  }, []);

  return { landmarks, frameWidth, frameHeight };
} 