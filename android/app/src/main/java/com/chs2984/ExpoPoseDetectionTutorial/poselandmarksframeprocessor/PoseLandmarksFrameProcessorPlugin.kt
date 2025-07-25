// PoseLandmarksFrameProcessorPlugin.kt
package com.chs2984.ExpoPoseDetectionTutorial.poselandmarksframeprocessor

import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import android.util.Log
import com.chs2984.ExpoPoseDetectionTutorial.PoseLandmarkerHolder

class PoseLandmarksFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {
  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any {
    Log.d("PoseLandmarksFrameProcessor", "Frame Processor Plugin called!")
    
    if (PoseLandmarkerHolder.poseLandmarker == null) {
      Log.e("PoseLandmarksFrameProcessor", "PoseLandmarker is not initialized")
      return "PoseLandmarker is not initialized"
    }

    Log.d("PoseLandmarksFrameProcessor", "PoseLandmarker is initialized, processing frame...")

    try {
      // Convert the frame to an MPImage
      val mpImage: MPImage = BitmapImageBuilder(frame.imageProxy.toBitmap()).build()

      // Get the timestamp from the frame
      val timestamp = frame.timestamp ?: System.currentTimeMillis()

      Log.d("PoseLandmarksFrameProcessor", "Calling detectAsync with timestamp: $timestamp")

      // Call detectAsync with MPImage and timestamp
      PoseLandmarkerHolder.poseLandmarker?.detectAsync(mpImage, timestamp)

      return "Frame processed successfully"
    } catch (e: Exception) {
      e.printStackTrace()
      Log.e("PoseLandmarksFrameProcessor", "Error processing frame: ${e.message}")
      return "Error processing frame: ${e.message}"
    }
  }
}