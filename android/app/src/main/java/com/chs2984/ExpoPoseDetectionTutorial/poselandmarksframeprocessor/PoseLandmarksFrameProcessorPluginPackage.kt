// HandLandmarksFrameProcessorPluginPackage.kt
package com.chs2984.ExpoPoseDetectionTutorial.poselandmarksframeprocessor

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import com.chs2984.ExpoPoseDetectionTutorial.poselandmarksframeprocessor.PoseLandmarksFrameProcessorPlugin

class PoseLandmarksFrameProcessorPluginPackage : ReactPackage {
  companion object {
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("poseLandmarks") { proxy, options ->
        PoseLandmarksFrameProcessorPlugin(proxy, options)
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return emptyList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}