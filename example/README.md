**실행순서**
```

yarn 
yarn install
yarn expo prebuild  시작점 만들어줌 
yarn install:backend
yarn expo start
---- 터미널 재시작 ----
yarn expo run:android 실제 핸드폰에 apk파일을 만듦듦
---- 터미널 재시작 ----
yarn start:android
터미널 
```
yarn dev-> 가상 빌드 폰에 접근 x
**참고자료**
- Expo Router Typed routes => https://docs.expo.dev/router/reference/typed-routes/
- npx expo run:android 필수

**폴더구조**

```
/app
├── _layout.tsx             # ✅ 전체 앱 레이아웃 및 AuthProvider
├── +not-found.tsx          # ✅ 404 페이지
├── index.tsx               # ✅ 리다이렉트 처리 (온보딩 완료 여부에 따라)
├── (auth)/                 # ✅ 인증 관련 화면
│    ├── _layout.tsx        # ✅ 인증 스택 레이아웃
│    ├── index.tsx          # ✅ 로그인 화면
│    ├── register.tsx       # ✅ 회원가입
│    ├── forgot-password.tsx # ✅ 비밀번호 찾기
├── onboarding/             # ✅ 온보딩 화면 (일반 라우트)
│    ├── _layout.tsx        # ✅ 온보딩 레이아웃
│    ├── index.tsx          # ✅ 온보딩 화면
├── (profile-setup)/        # ✅ 프로필 설정 화면
│    ├── _layout.tsx        # ✅ 프로필 설정 레이아웃
│    ├── index.tsx          # ✅ 프로필 세팅 문항 화면
├── (payment)/              # ✅ 결제 관련 화면
│    ├── _layout.tsx        # ✅ 결제 레이아웃
│    ├── index.tsx          # ✅ 결제 메인 화면
│    ├── page1.tsx          # ✅ 추가 페이지 1
│    ├── page2.tsx          # ✅ 추가 페이지 2
├── (app)/                  # ✅ 메인 앱 화면 (탭 기반 네비게이션)
│    ├── _layout.tsx        # ✅ 인증 보호 레이아웃
│    ├── (tabs)/            # ✅ 탭 네비게이션
│    │    ├── _layout.tsx   # ✅ 탭 레이아웃
│    │    ├── home/
│    │    │    ├── index.tsx # ✅ 홈 화면
│    ├── (modals)/          # ✅ 모달 화면
│    │    ├── notifications.tsx # ✅ 알림 모달
```

**Flow**
1. 앱 실행 → 온보딩 화면 표시 (/onboarding)
2. 온보딩 완료 → 로그인/회원가입 화면 (/(auth))
3. 로그인/회원가입 → 사용자 정보가 없는 경우 프로필 설정 화면 (/(profile-setup))
4. 프로필 설정 완료 → 구독 정보가 없는 경우 결제 화면 (/(payment))
5. 결제 완료 → 메인 앱 화면 (/(app)/(tabs)/home)

**조건 분기 로직**
- 인증 상태 확인 → 미인증 시 로그인 화면으로
- 프로필 완성도 확인 → 미완성 시 프로필 설정 화면으로
- 구독 상태 확인 → 구독 없을 시 결제 화면으로
- 모든 조건 충족 시 메인 앱 화면으로

**컨텍스트 파일**
```
/contexts
├── AuthContext.tsx      # ✅ 인증 관련 상태 관리
├── UserContext.tsx      # ✅ 사용자 프로필 정보 관리
├── SubscriptionContext.tsx  # ✅ 구독 정보 관리
```

**개발 참고사항**
- 테스트를 위해 현재 앱 실행 시 항상 온보딩 화면으로 이동하도록 설정됨
- 실제 앱 배포 시에는 앱 첫 실행 시에만 온보딩이 표시되도록 수정 필요
- 프로필 설정과 결제 화면은 백엔드 연동 없이 로컬에서 상태 관리하여 테스트 가능
- 각 화면에는 다음/이전 버튼이 있어 순차적으로 앱의 모든 화면을 볼 수 있음
- 메인 앱 화면에서 "앱 리셋" 버튼을 클릭하면 온보딩 화면으로 돌아갈 수 있음

**UI 컴포넌트**
- NativeWind를 사용한 스타일링 적용
- components/ui 폴더의 공통 컴포넌트 활용 (Button, Text, Card 등)
- 스타일시트 직접 정의 대신 className 속성 사용

**🎬 로딩 시스템**
- 3단계 적응형 로딩 시스템 (FULL/QUICK/MINIMAL)
- 최초 방문자: 5초 픽사 스타일 브랜딩 애니메이션
- 재방문자: 1-2초 최적화된 로딩 경험
- 백그라운드 데이터 로딩으로 성능 최적화
- 상세 가이드: [docs/loading-system.md](docs/loading-system.md)
- 개발자 도구: `app/(dev-tools)/LoadingSystemTest.dev.tsx`
- 모든 모드에서 일관된 점 3개 애니메이션 사용

**🤸‍♂️ Pose Detection 기능 (실시간 자세 분석/피드백/저장)**
- **개요:** `react-native-vision-camera`와 Google MediaPipe를 사용하여 사용자의 자세를 실시간으로 감지, 분석, 피드백, 그리고 결과를 앱 캐시에 저장하는 기능입니다. 사용자는 정면/후면/좌측/우측 4가지 신체 방향을 선택할 수 있으며, 각 방향별로 어깨 대칭성, 자세 점수, 문제 부위(예: 어깨 비대칭) 등을 실시간으로 분석하고 시각화합니다.
- **핵심 기술:** Vision Camera (Frame Processor), MediaPipe (PoseLandmarker), React Native View (시각화), JSI/Worklets, DeviceEventEmitter, Custom Hooks, 실시간 캐시 저장
- **히스테리시스 적용:** 어깨 대칭성(높이 차이) 문제점 표시에 히스테리시스(상·하 경계값) 로직을 적용하여, 경계값 근처에서 문제점 표시가 깜빡이지 않고 안정적으로 유지됩니다. (예: 2.0cm 초과 시 '문제 있음', 1.0cm 미만 시 '정상', 그 사이에서는 상태 유지)
- **주요 파일:**
    - `app/camera/modes/PoseDetectionMode.tsx`: 카메라 뷰, 방향 선택, 분석, 피드백, 저장까지 통합한 메인 UI 컴포넌트
    - `hooks/usePoseLandmarks.ts`: 네이티브 모듈로부터 랜드마크 이벤트를 수신하는 커스텀 훅
    - `hooks/useBodyOrientation.ts`: 신체 방향(정면/후면/좌측/우측) 선택 및 관리 훅
    - `hooks/usePoseAnalysis.ts`: 랜드마크와 방향을 입력받아 어깨 각도, 대칭성, 자세 점수, 문제점, 권장사항을 분석하는 훅 (히스테리시스 상태 관리 포함)
    - `hooks/usePoseResultCache.ts`: 분석 결과를 실시간으로 앱 캐시에 저장하는 훅
    - `app/camera/components/BodyOrientationSelector.tsx`: 방향 선택 UI 컴포넌트
    - `app/camera/components/PoseFeedbackOverlay.tsx`: 분석 결과를 실시간으로 시각화하는 오버레이
    - `app/camera/utils/pose-analysis-utils.ts`: 어깨 각도, 대칭성, 자세 점수 등 분석 알고리즘 (히스테리시스 로직 포함)
    - `app/camera/utils/pose-result-cache-utils.ts`: 분석 결과를 JSON 형태로 캐시에 저장/불러오기
- **테스트:** `app/(dev-tools)/PoseDetection.dev.tsx`에서 독립적으로 전체 기능을 테스트할 수 있습니다.

**🧩 주요 기능 및 실행 흐름**
1. **방향 선택**: 사용자가 정면/후면/좌측/우측 중 하나를 선택 (BodyOrientationSelector)
2. **실시간 포즈 감지**: Vision Camera + MediaPipe로 33개 신체 랜드마크 실시간 추출
3. **자세 분석**: 어깨 각도, 대칭성, 자세 점수, 문제점, 권장사항을 실시간 산출 (usePoseAnalysis)
4. **피드백 시각화**: 문제 부위(예: 어깨)에 동그라미, 점수/문제/권장사항을 오버레이로 표시 (PoseFeedbackOverlay)
5. **결과 저장**: 분석 결과가 5초마다 앱 캐시에 자동 저장 (usePoseResultCache)
6. **확장성**: 분석 항목(골반, 무릎 등) 추가, 히스토리 조회, 운동 자세 분류 등으로 확장 가능

**📁 파일 구조 (핵심)**
```
hooks/
├── useBodyOrientation.ts      # 방향 관리
├── usePoseAnalysis.ts         # 포즈 분석
├── usePoseResultCache.ts      # 캐시 저장
└── usePoseLandmarks.ts        # 랜드마크 수신
app/camera/
├── components/
│   ├── BodyOrientationSelector.tsx  # 방향 선택 UI
│   └── PoseFeedbackOverlay.tsx      # 피드백 시각화
├── utils/
│   ├── pose-analysis-utils.ts       # 분석 알고리즘
│   └── pose-result-cache-utils.ts   # 캐시 저장 로직
└── modes/
    └── PoseDetectionMode.tsx        # 통합 모드
```

**🔄 실행 흐름 요약**
1. 앱 실행 → PoseDetectionMode 진입
2. 방향 선택 → 카메라에서 실시간 포즈 감지
3. 분석 결과(점수, 대칭성, 문제점 등) 실시간 표시
4. 문제 부위(어깨 등)에 동그라미 강조 및 텍스트 피드백
5. 분석 결과가 5초마다 앱 캐시에 자동 저장됨 (JSON)

**🎨 시각화 예시**
- 어깨 대칭성 문제 발생 시 해당 어깨에 붉은 동그라미 표시
- 자세 점수/대칭성/문제점/권장사항을 하단 오버레이로 안내

**🗃️ 저장 방식**
- 분석 결과는 JSON 파일로 앱 캐시에 저장 (향후 expo-file-system 연동 권장)
- 저장 데이터: 방향, 점수, 대칭성, 문제점, 권장사항, 랜드마크 등

**🧑‍💻 확장/활용 예시**
- 자세 히스토리 조회, 운동 자세 분류, 자세 교정 알림, 데이터 기반 리포트 등으로 확장 가능

**테스트 방법**
- `app/(dev-tools)/PoseDetection.dev.tsx`에서 모든 기능을 실시간으로 확인 가능
- 콘솔에서 캐시 저장 로그 확인

**🔧 Pose Detection 오류 해결 과정**
- **문제:** `@shopify/react-native-skia` 사용 시 `TypeError: Cannot read property 'S' of undefined` 오류 발생
- **원인 분석:**
  1. Skia Canvas 초기화에서 발생하는 라이브러리 내부 오류
  2. worklet 컨텍스트에서 별도 함수 호출 시 접근 제한
  3. Frame Processor와 Skia 간의 호환성 문제
- **해결 방법:**
  1. **Skia 완전 제거:** `@shopify/react-native-skia` 대신 순수 React Native View 사용
  2. **인라인 플러그인 초기화:** worklet 내부에서 직접 `VisionCameraProxy.initFrameProcessorPlugin` 호출
  3. **단순화된 시각화:** 복잡한 Canvas 렌더링 대신 `View` + `borderRadius`로 포인트 표시
- **최종 아키텍처:**
  ```
  📱 Camera View
  ├── 🎥 VisionCamera (react-native-vision-camera)
  │   ├── Frame Processor (worklet)
  │   └── Native Plugin (poseLandmarks)
  ├── 👁️ React Native Overlay (View)
  │   ├── 포즈 포인트 (View + borderRadius)
  │   └── 실시간 정보 표시
  └── 📊 usePoseLandmarks Hook
      └── DeviceEventEmitter (Native → JS)
  ```
- **성능:** Skia 없이도 실시간 포즈 감지 및 시각화가 완벽하게 작동하며, 더 안정적이고 단순한 구조 구현

---

## 🤸‍♂️ **Pose Detection 총 기능 완전 정리 (2025-07 최신)**

### 📋 **1. 전체 기능 개요**
Fitlyever 앱의 포즈 디텍션 시스템은 **Google MediaPipe PoseLandmarker**와 **React Native Vision Camera**를 기반으로 한 실시간 자세 분석 시스템입니다. 사용자의 전신 33개 랜드마크를 실시간으로 감지하여 자세를 분석하고, 문제점을 시각화하며, 개선 권장사항을 제공합니다.

### 🎯 **2. 핵심 모드 및 기능**

#### **2.1 정면 포즈 디텍션 모드 (PoseDetectionMode)**
- **33개 전신 랜드마크** 실시간 감지 및 시각화
- **4방향 신체 방향** 선택 (정면/후면/좌측/우측)
- **키네마틱 체인 기반 분석**: 골반 → 척추 → 어깨 → 머리/목 순차 분석
- **자세 점수 계산**: 균형점수 + 대칭성점수 + 정렬점수 종합 (0-100점)
- **어깨 대칭성 분석**: 히스테리시스 로직으로 안정적인 문제점 표시
- **실시간 피드백**: 문제 부위 강조 + 권장사항 텍스트
- **자동 캐시 저장**: 5초마다 분석 결과 JSON 저장

#### **2.2 측면 포즈 디텍션 모드 (SidePoseDetectionMode)**
- **측면 전용 랜드마크** 필터링 (코, 귀, 어깨, 엉덩이, 무릎, 발목)
- **좌우 방향 자동 감지**: Z값(깊이) 기반 고도화된 방향 판단
- **CVA(거북목) 각도 측정**: 귀-어깨 벡터 vs 수직 벡터 각도 계산
- **거북목 판별**: 50도 미만 시 🐢 이모티콘 표시 (화면 왼쪽 위 고정)
- **측면 연결선 시각화**: CVA 계산용 연결선은 검은색으로 강조
- **색상별 랜드마크**: 다리(금색), 엉덩이(초록), 귀(빨강), 어깨(청록)

### 🛠️ **3. 기술 스택 및 아키텍처**

#### **3.1 네이티브 성능 최적화**
- **Frame Processor + JSI/Worklets**: UI 스레드 블로킹 없는 네이티브 성능
- **VisionCameraProxy.initFrameProcessorPlugin**: 인라인 플러그인 초기화
- **DeviceEventEmitter**: 네이티브 ↔ JavaScript 고성능 통신
- **경량화 모델**: `pose_landmarker_lite.task` 사용으로 실시간 처리

#### **3.2 좌표 변환 시스템**
```typescript
// 정규화 좌표(0-1) → 화면 절대 좌표
transformPoint(landmark, cameraPosition, cameraLayout)
// 1. 90° 반시계 회전 (portrait 대응)
// 2. 전면/후면 카메라 미러링 보정
// 3. Android 플랫폼별 추가 보정
// 4. 카메라 레이아웃 스케일링
```

#### **3.3 분석 알고리즘**
- **키네마틱 체인 분석**: 골반 → 척추 → 어깨 → 머리/목
- **히스테리시스 로직**: 경계값 근처 깜빡임 방지
- **로지스틱 점수 계산**: 시그모이드 함수로 부드러운 점수 변화
- **보상 패턴 감지**: 한 부위 문제가 다른 부위에 미치는 영향 분석

### 📊 **4. 상세 분석 항목**

#### **4.1 골반 정렬 (PelvicAlignment)**
- 좌우 높이 차이 (cm)
- 회전 각도 (도)
- 전후 경사 각도 (도)
- 수평 여부 판단

#### **4.2 척추 정렬 (SpineAlignment)**
- 측면 만곡 (Cobb 각도)
- 후만증 각도
- 전만증 각도
- 척추 측만 각도

#### **4.3 어깨 정렬 (ShoulderAlignment)**
- 좌우 높이 차이
- 회전 각도
- 전방 돌출 정도
- 상승 정도

#### **4.4 머리/목 정렬 (HeadNeckAlignment)**
- 전방 머리 위치 (FHP)
- 목 각도
- 머리 기울기

#### **4.5 자세 패턴 분류 (PosturePattern)**
- **A형**: 골반 좌우 경사 + 어깨 회전형
- **B형**: 전방경사 + FHP (앉은 자세형)
- **C형**: 편측 압박 + 요측만 + 어깨 내림
- **D형**: 군인형 자세 (과도한 후방 정렬)
- **E형**: 정상 자세

### 🎨 **5. 시각화 시스템**

#### **5.1 랜드마크 색상 코딩**
- **얼굴/목** (0-10): 빨강 (#FF6B6B)
- **어깨/팔** (11-16): 청록 (#4ECDC4)
- **손목/손가락** (17-22): 파랑 (#45B7D1)
- **엉덩이/다리** (23-28): 초록 (#96CEB4)
- **발목/발가락** (29-32): 노랑 (#FFEAA7)

#### **5.2 연결선 렌더링**
- **동적 연결선**: 가시성 기반 필터링 (50% 이상)
- **회전 변환**: `Math.atan2`로 정확한 각도 계산
- **색상 매핑**: 시작점 랜드마크 색상 적용

#### **5.3 문제점 강조**
- **어깨 문제**: 붉은 동그라미 (30px, 3px 테두리)
- **CVA 연결선**: 검은색 강조 (3px 두께)
- **거북목 알림**: 🐢 이모티콘 (화면 좌상단 고정)

### 📱 **6. 사용자 인터페이스**

#### **6.1 실시간 정보 표시**
- **상단 고정**: 자세 점수 + 어깨 대칭성 (반투명 배경)
- **하단 오버레이**: 발견된 문제 + 권장사항 (선택적 비활성화 가능)
- **카메라 전환**: 전면/후면 전환 버튼 (화면 우측 중앙)

#### **6.2 방향 선택 UI**
- **4방향 버튼**: 정면/후면/좌측면/우측면
- **활성 상태 표시**: 선택된 방향 하이라이트
- **반투명 배경**: 카메라 위에 오버레이

### 🗄️ **7. 데이터 관리**

#### **7.1 실시간 캐시 저장**
- **저장 주기**: 5초마다 자동 저장
- **데이터 형식**: JSON (방향, 점수, 대칭성, 문제점, 권장사항, 랜드마크)
- **저장 위치**: 앱 캐시 (향후 expo-file-system 연동 예정)

#### **7.2 분석 결과 구조**
```typescript
interface PoseAnalysisResult {
  shoulderAngle: number;
  shoulderSymmetry: number;
  postureScore: number;
  kinematicChain: KinematicChainAnalysis;
  posturePattern: PosturePattern;
  compensationPatterns: CompensationPattern[];
  issues: string[];
  recommendations: string[];
}
```

### 🧪 **8. 개발/테스트 도구**

#### **8.1 개발자 도구**
- **PoseDetection.dev.tsx**: 정면 포즈 디텍션 테스트
- **SidePoseDetectionTest.dev.tsx**: 측면 포즈 디텍션 테스트
- **실시간 로깅**: 랜드마크 수, 분석 결과, 캐시 저장 상태

#### **8.2 성능 모니터링**
- **프레임레이트**: 30fps 이상 실시간 처리
- **메모리 사용량**: 메모이제이션으로 최적화
- **배터리 효율성**: 네이티브 최적화로 전력 소모 최소화

### 🚀 **9. 성능 최적화**

#### **9.1 렌더링 최적화**
- **React.useMemo**: 좌표 변환, 연결선 생성 메모이제이션
- **가시성 필터링**: 50% 미만 가시성 랜드마크 제외
- **배치 업데이트**: 여러 상태 변경을 한 번에 처리

#### **9.2 네이티브 최적화**
- **Worklet 사용**: UI 스레드 블로킹 방지
- **JSI 직접 호출**: React Native 브릿지 우회
- **경량 모델**: 정확도와 성능의 균형점

### 🔮 **10. 향후 확장 계획**

#### **10.1 기능 확장**
- **다중 포즈 감지**: 여러 사람 동시 분석
- **운동 자세 분류**: 스쿼트, 데드리프트 등 특정 운동 자세 분석
- **자세 히스토리**: 시간별 자세 변화 추적
- **AI 코칭**: 개인별 맞춤 자세 교정 가이드

#### **10.2 기술 개선**
- **더 높은 프레임레이트**: 60fps 지원
- **3D 포즈 분석**: 깊이 정보 활용한 3차원 분석
- **웨어러블 연동**: 스마트워치, 피트니스 밴드 데이터 통합
- **클라우드 분석**: 서버 기반 고급 분석 알고리즘

### 📚 **11. 사용된 주요 라이브러리**

| 라이브러리 | 버전 | 역할 |
|-----------|------|------|
| **react-native-vision-camera** | ^4.7.1 | 실시간 카메라, Frame Processor |
| **@thinksys/react-native-mediapipe** | ^0.0.13 | MediaPipe PoseLandmarker |
| **react-native** | 0.76.9 | RN 기본 컴포넌트 |
| **react-native-svg** | ^15.12.0 | SVG 아이콘 렌더링 |
| **expo** | ~52.0.47 | 앱 실행/빌드 |
| **nativewind** | ~4.1.23 | Tailwind 스타일링 |

### 🎯 **12. 사용법 요약**

1. **앱 실행** → `app/(dev-tools)/PoseDetection.dev.tsx` 또는 `SidePoseDetectionTest.dev.tsx`
2. **카메라 권한** 허용
3. **방향 선택** (정면/측면 모드에 따라)
4. **자세 취하기** → 실시간 분석 결과 확인
5. **문제점 확인** → 시각적 피드백 및 권장사항 확인
6. **결과 저장** → 자동으로 캐시에 저장됨

---

**이 포즈 디텍션 시스템은 실시간 성능, 정확한 분석, 직관적인 시각화를 모두 갖춘 완성도 높은 자세 분석 솔루션입니다. 헬스케어, 피트니스, 재활 등 다양한 분야에서 활용 가능합니다.**
