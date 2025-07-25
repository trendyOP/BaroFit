# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## 개발 과정 및 오류 해결 기록

이 섹션은 `react-native-vision-camera`와 MediaPipe를 연동하여 실시간 포즈 감지 기능을 구현하는 과정에서 발생했던 주요 오류와 해결 방법을 기록합니다.

### 1. Skia를 SVG로 교체 및 초기 설정

- **목표**: `@shopify/react-native-skia`를 제거하고 `react-native-svg`를 사용하여 스켈레톤 오버레이를 구현.
- **해결**:
    - `yarn remove @shopify/react-native-skia`
    - `yarn add react-native-svg`
    - `exercise.tsx`에서 `<Canvas>`와 Skia 컴포넌트를 `<Svg>`와 관련 컴포넌트(`Line`, `Circle`)로 교체.

### 2. 네이티브 빌드 오류 (CMake & JSI)

- **오류**: `ld.lld: error: undefined symbol: RNWorklet::JsiWorkletContext::...`
    - `react-native-vision-camera`와 `react-native-worklets-core` 간의 JSI 링크 오류로 인해 발생.
- **해결**:
    1.  **라이브러리 버전 동기화**: `react-native-vision-camera@4.7.1`, `react-native-worklets-core@1.5.0`, `react-native-reanimated@~3.17.4` 등 호환되는 버전으로 통일.
    2.  **`babel.config.js` 설정**: `plugins` 배열에 `'react-native-worklets-core/plugin'`과 `'react-native-reanimated/plugin'`을 추가하여 Worklet 및 Reanimated 플러그인을 활성화.
    3.  **`CMakeLists.txt` 수정**: `node_modules/react-native-vision-camera/android/CMakeLists.txt` 파일에 `react-native-worklets-core`의 네이티브 라이브러리(`librnworklets.so`)를 직접 링크하도록 `target_link_libraries` 설정을 추가.

### 3. Android 권한 및 네이티브 모듈 설정

- **오류**:
    - 앱에서 카메라 권한을 요청하지 않음.
    - "Frame Processor Error: Failed to load Frame Processor Plugin!"
- **해결**:
    1.  **카메라 권한**: `app.json` 파일의 `android.permissions` 배열에 `"android.permission.CAMERA"`를 추가.
    2.  **VisionCamera 플러그인**: `app.json`의 `plugins` 배열에 `"react-native-vision-camera"`를 추가.
    3.  **네이티브 모듈 등록**:
        - `MainApplication.kt`의 `getPackages()` 함수에 커스텀으로 생성한 `PoseLandmarksPackage`와 `PoseLandmarksFrameProcessorPluginPackage`를 추가하여 React Native가 네이티브 모듈을 인식할 수 있도록 함.
        - `android/app/build.gradle`에 MediaPipe (`tasks-vision`) 의존성을 추가.

### 4. 랜드마크 좌표 변환 및 정렬 문제

- **문제**: MediaPipe에서 받은 정규화된 랜드마크 좌표(0-1)가 실제 카메라 화면의 인물과 정확하게 일치하지 않고 약간의 오프셋이 발생.
- **원인**:
    - 카메라 원본 프레임(e.g., 640x480)과 화면에 표시되는 `Camera` 뷰(e.g., 360x683)의 종횡비가 다름.
    - `resizeMode="cover"`와 유사하게 화면을 채우면서 발생하는 이미지 잘림(crop)을 고려하지 않음.
- **해결**:
    - `app/camera/utils/pose-utils.ts`의 `transformPoint` 함수를 수정.
    - 기존의 단순 스케일링 방식에서, **프레임과 화면 레이아웃의 종횡비를 모두 계산**하여 `cover` 모드와 동일하게 스케일 팩터와 오프셋을 계산하는 로직으로 변경.
    - 이를 통해 잘려나간 영역을 정확히 계산하여 랜드마크 좌표를 보정함으로써 화면과 실제 위치의 정합성을 크게 개선.

### 5. Expo 경로 해석(`@/`) 문제

- **오류**: `Cannot find module '@/hooks/...'`
    - `tsconfig.json`의 `paths` 설정에 `@/*`가 정의되어 있음에도 불구하고 모듈을 찾지 못하는 문제.
- **해결**:
    - `tsconfig.json`의 `paths` 설정이 `@/*`: `["./*"]`로 올바르게 되어 있는지 재확인.
    - Expo 캐시 문제일 수 있으므로 `npx expo start -c` 명령어로 캐시를 초기화한 후 재실행하여 해결.
