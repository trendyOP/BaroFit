import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

let plugin: any = null;
let isInitialized = false;

/**
 * Lazily initializes the pose landmarks frame processor plugin.
 * This prevents initialization errors when the app starts.
 */
function initializePlugin() {
  'worklet';
  
  if (isInitialized) {
    console.log('🔍 initializePlugin: Already initialized, returning existing plugin');
    return plugin;
  }
  
  console.log('🔍 initializePlugin: Starting initialization...');
  
  try {
    console.log('🔍 initializePlugin: Checking VisionCameraProxy availability...');
    console.log('🔍 initializePlugin: VisionCameraProxy exists:', typeof VisionCameraProxy);
    console.log('🔍 initializePlugin: initFrameProcessorPlugin exists:', typeof VisionCameraProxy.initFrameProcessorPlugin);
    
    console.log('🔍 initializePlugin: Calling VisionCameraProxy.initFrameProcessorPlugin...');
    plugin = VisionCameraProxy.initFrameProcessorPlugin('poseLandmarks', {});
    console.log('🔍 initializePlugin: Plugin initialization returned:', plugin);
    
    isInitialized = true;
    
    if (plugin == null) {
      console.error('❌ initializePlugin: Failed to initialize poseLandmarks frame processor plugin');
    } else {
      console.log('✅ initializePlugin: Successfully initialized poseLandmarks frame processor plugin');
    }
  } catch (error) {
    console.error('❌ initializePlugin: Error initializing poseLandmarks frame processor plugin:', error);
    console.error('❌ initializePlugin: Error type:', typeof error);
    console.error('❌ initializePlugin: Error stringified:', JSON.stringify(error));
    plugin = null;
  }
  
  return plugin;
}

/**
 * Scans a Frame for poses using the native PoseLandmarker frame processor.
 *
 * @param frame The camera frame to process.
 * @returns A status string from the native processor. The actual landmark data is sent via a device event.
 */
export function poseLandmarker(frame: Frame): string {
  'worklet';
  
  console.log('🔍 poseLandmarker: Starting...');
  
  let currentPlugin: any = null;
  
  // 직접 인라인으로 플러그인 초기화 처리
  try {
    console.log('🔍 poseLandmarker: Checking if already initialized...');
    if (isInitialized) {
      console.log('🔍 poseLandmarker: Using existing plugin');
      currentPlugin = plugin;
    } else {
      console.log('🔍 poseLandmarker: Initializing new plugin...');
      console.log('🔍 poseLandmarker: VisionCameraProxy type:', typeof VisionCameraProxy);
      
      currentPlugin = VisionCameraProxy.initFrameProcessorPlugin('poseLandmarks', {});
      console.log('🔍 poseLandmarker: Plugin initialization result:', currentPlugin);
      
      plugin = currentPlugin;
      isInitialized = true;
    }
    
    console.log('🔍 poseLandmarker: Plugin ready:', currentPlugin != null);
  } catch (error) {
    console.error('❌ poseLandmarker: Error initializing plugin:', error);
    console.error('❌ poseLandmarker: Error type:', typeof error);
    console.error('❌ poseLandmarker: Error stringified:', JSON.stringify(error));
    return 'Error initializing plugin';
  }
  
  if (currentPlugin == null) {
    console.log('❌ poseLandmarker: Plugin not available');
    return 'Plugin not available';
  }
  
  try {
    console.log('🔍 poseLandmarker: Calling plugin...');
    const result = currentPlugin.call(frame) as string;
    console.log('✅ poseLandmarker: Plugin call successful:', result);
    return result;
  } catch (error) {
    console.error('❌ poseLandmarker: Error in plugin call:', error);
    console.error('❌ poseLandmarker: Error type:', typeof error);
    console.error('❌ poseLandmarker: Error stringified:', JSON.stringify(error));
    return 'Error processing frame';
  }
} 