import type { BodyOrientation } from '@/app/camera/hooks/useBodyOrientation';
import type { Pose } from '@/app/camera/hooks/usePoseLandmarks';

// 키네마틱 체인 기반 전신 자세 분석 결과
export interface PoseAnalysisResult {
  // 기존 분석 결과 (하위 호환성)
  shoulderAngle: number;
  shoulderSymmetry: number;
  postureScore: number;
  
  // 새로운 키네마틱 체인 분석
  kinematicChain: KinematicChainAnalysis;
  posturePattern: PosturePattern;
  compensationPatterns: CompensationPattern[];
  
  // 종합 결과
  issues: string[];
  recommendations: string[];
}

// 키네마틱 체인 분석 결과
export interface KinematicChainAnalysis {
  pelvic: PelvicAlignment;
  spine: SpineAlignment;
  shoulder: ShoulderAlignment;
  headNeck: HeadNeckAlignment;
  overall: OverallAlignment;
}

// 골반 정렬 분석
export interface PelvicAlignment {
  heightDifference: number; // 좌우 높이 차이 (cm)
  rotation: number; // 회전 각도 (도)
  tilt: number; // 전후 경사 각도 (도)
  isLevel: boolean; // 수평 여부
  issues: string[];
}

// 척추 정렬 분석
export interface SpineAlignment {
  lateralCurve: number; // 측면 만곡 (Cobb 각도)
  kyphosis: number; // 후만증 각도
  lordosis: number; // 전만증 각도
  deviation: number; // 척추 측만 각도
  issues: string[];
}

// 어깨 정렬 분석
export interface ShoulderAlignment {
  heightDifference: number; // 좌우 높이 차이
  rotation: number; // 회전 각도
  protraction: number; // 전방 돌출
  elevation: number; // 상승 정도
  issues: string[];
}

// 머리/목 정렬 분석
export interface HeadNeckAlignment {
  forwardHead: number; // 전방 머리 위치 (FHP)
  neckAngle: number; // 목 각도
  headTilt: number; // 머리 기울기
  issues: string[];
}

// 전체 정렬 분석
export interface OverallAlignment {
  balanceScore: number; // 균형 점수 (0-100)
  symmetryScore: number; // 대칭성 점수 (0-100)
  alignmentScore: number; // 정렬 점수 (0-100)
  issues: string[];
}

// 자세 패턴 분류
export enum PosturePattern {
  TYPE_A = 'A형', // 골반 좌우 경사 + 어깨 회전형
  TYPE_B = 'B형', // 전방경사 + FHP (전형적 앉은 자세형)
  TYPE_C = 'C형', // 편측 압박 + 요측만 + 어깨 내림
  TYPE_D = 'D형', // 군인형 자세 (과도한 후방 정렬)
  TYPE_E = 'E형', // 정상 자세
  UNKNOWN = '미분류'
}

// 보상 패턴
export interface CompensationPattern {
  type: 'pelvic_compensation' | 'spine_compensation' | 'shoulder_compensation' | 'head_compensation';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  affectedJoints: string[];
}

export interface LandmarkPoint {
  x: number;
  y: number;
  visibility: number;
}

// MediaPipe Pose 랜드마크 인덱스 (확장)
export const POSE_LANDMARKS = {
  // 머리/목
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  
  // 어깨/팔
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  
  // 골반/다리
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  
  // 척추 중간점 (추정)
  MID_SPINE: 29, // 척추 중간점
  MID_PELVIS: 30, // 골반 중간점
} as const;

// 분석 기준 상수
export const ANALYSIS_THRESHOLDS = {
  // 골반
  PELVIC_HEIGHT_DIFF_WARNING: 1.0, // cm
  PELVIC_HEIGHT_DIFF_CRITICAL: 2.0,
  PELVIC_ROTATION_WARNING: 5, // 도
  PELVIC_ROTATION_CRITICAL: 10,
  PELVIC_TILT_WARNING: 10, // 도
  PELVIC_TILT_CRITICAL: 15,
  
  // 척추
  SPINE_LATERAL_CURVE_WARNING: 5, // 도
  SPINE_LATERAL_CURVE_CRITICAL: 10,
  SPINE_KYPHOSIS_WARNING: 40, // 도
  SPINE_KYPHOSIS_CRITICAL: 50,
  SPINE_LORDOSIS_WARNING: 60, // 도
  SPINE_LORDOSIS_CRITICAL: 70,
  
  // 어깨
  SHOULDER_HEIGHT_DIFF_WARNING: 1.0, // cm
  SHOULDER_HEIGHT_DIFF_CRITICAL: 2.0,
  SHOULDER_ROTATION_WARNING: 5, // 도
  SHOULDER_ROTATION_CRITICAL: 10,
  
  // 머리/목
  FORWARD_HEAD_WARNING: 2.0, // cm
  FORWARD_HEAD_CRITICAL: 4.0,
  NECK_ANGLE_WARNING: 45, // 도
  NECK_ANGLE_CRITICAL: 35,
  
  // 전체
  BALANCE_SCORE_WARNING: 70,
  BALANCE_SCORE_CRITICAL: 50,
  SYMMETRY_SCORE_WARNING: 80,
  SYMMETRY_SCORE_CRITICAL: 60,
} as const;

// 점수 계산 가중치 (재조정)
export const SCORE_WEIGHTS = {
  PELVIC: 0.25,
  SPINE: 0.25,
  SHOULDER: 0.25,
  HEAD_NECK: 0.25,
  COMPENSATION_PENALTY: 0.1,
  
  // 세부 가중치 (정규화 후 적용)
  PELVIC_HEIGHT: 0.4,
  PELVIC_ROTATION: 0.3,
  PELVIC_TILT: 0.3,
  
  SHOULDER_HEIGHT: 0.4,
  SHOULDER_ROTATION: 0.3,
  HEAD_TILT: 0.3,
  
  SPINE_DEVIATION: 0.4,
  SPINE_KYPHOSIS: 0.3,
  FORWARD_HEAD: 0.3,
} as const;

// 로지스틱 함수 (시그모이드)
function sigmoid(x: number, k: number = 8, mid: number = 0.6): number {
  return 100 / (1 + Math.exp(k * (x - mid)));
}

// 입력값 정규화 함수
function normalizeValue(value: number, threshold: number): number {
  return Math.min(value / threshold, 1);
}

// 좌표 변환 함수 (PoseFeedbackOverlay와 동일한 로직)
export function transformLandmarkPoint(
  p: { x: number; y: number },
  devicePosition: 'front' | 'back'
): { x: number; y: number } {
  let x = p.y; // 90° 반시계 회전
  let y = 1 - p.x;
  
  if (devicePosition === 'front') {
    x = 1 - x; // 전면 카메라 미러링
  }
  if (devicePosition === 'back') {
    x = 1 - x; // 후면 카메라 미러링
    y = 1 - y;
  }
  
  return { x, y };
}

// 두 점 사이의 각도 계산 (도)
export function calculateAngle(
  point1: LandmarkPoint,
  point2: LandmarkPoint,
  point3: LandmarkPoint
): number {
  const radians = Math.atan2(
    point3.y - point2.y,
    point3.x - point2.x
  ) - Math.atan2(
    point1.y - point2.y,
    point1.x - point2.x
  );
  
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }f
  
  return angle;
}

// 두 점 사이의 거리 계산 (정규화된 좌표)
export function calculateDistance(point1: LandmarkPoint, point2: LandmarkPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 골반 정렬 분석
export function analyzePelvicAlignment(
  landmarks: Pose,
  devicePosition: 'front' | 'back'
): PelvicAlignment {
  if (landmarks.length < 33) {
    return {
      heightDifference: 0,
      rotation: 0,
      tilt: 0,
      isLevel: true,
      issues: ['골반 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  
  if (!leftHip || !rightHip) {
    return {
      heightDifference: 0,
      rotation: 0,
      tilt: 0,
      isLevel: true,
      issues: ['골반 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  // 좌표 변환 적용
  const transformedLeftHip = transformLandmarkPoint(leftHip, devicePosition);
  const transformedRightHip = transformLandmarkPoint(rightHip, devicePosition);
  
  // 골반 높이 차이 계산
  const heightDifference = Math.abs(transformedLeftHip.y - transformedRightHip.y) * 100; // cm로 변환 (대략적)
  
  // 골반 회전 계산
  const rotation = Math.atan2(
    transformedRightHip.y - transformedLeftHip.y,
    transformedRightHip.x - transformedLeftHip.x
  ) * 180 / Math.PI;
  
  // 골반 전후 경사 계산 (무릎과의 관계)
  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  
  let tilt = 0;
  if (leftKnee && rightKnee) {
    const transformedLeftKnee = transformLandmarkPoint(leftKnee, devicePosition);
    const transformedRightKnee = transformLandmarkPoint(rightKnee, devicePosition);
    
    const hipCenterY = (transformedLeftHip.y + transformedRightHip.y) / 2;
    const kneeCenterY = (transformedLeftKnee.y + transformedRightKnee.y) / 2;
    tilt = Math.atan2(hipCenterY - kneeCenterY, 0.1) * 180 / Math.PI;
  }
  
  const issues: string[] = [];
  
  if (heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_CRITICAL) {
    issues.push('골반이 심하게 기울어져 있습니다');
  } else if (heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_WARNING) {
    issues.push('골반이 기울어져 있습니다');
  }
  
  if (Math.abs(rotation) > ANALYSIS_THRESHOLDS.PELVIC_ROTATION_CRITICAL) {
    issues.push('골반이 심하게 회전되어 있습니다');
  } else if (Math.abs(rotation) > ANALYSIS_THRESHOLDS.PELVIC_ROTATION_WARNING) {
    issues.push('골반이 회전되어 있습니다');
  }
  
  if (Math.abs(tilt) > ANALYSIS_THRESHOLDS.PELVIC_TILT_CRITICAL) {
    issues.push('골반이 심하게 경사져 있습니다');
  } else if (Math.abs(tilt) > ANALYSIS_THRESHOLDS.PELVIC_TILT_WARNING) {
    issues.push('골반이 경사져 있습니다');
  }
  
  return {
    heightDifference,
    rotation,
    tilt,
    isLevel: heightDifference < ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_WARNING,
    issues,
  };
}

// 척추 정렬 분석
export function analyzeSpineAlignment(
  landmarks: Pose,
  devicePosition: 'front' | 'back'
): SpineAlignment {
  if (landmarks.length < 33) {
    return {
      lateralCurve: 0,
      kyphosis: 0,
      lordosis: 0,
      deviation: 0,
      issues: ['척추 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
  
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      lateralCurve: 0,
      kyphosis: 0,
      lordosis: 0,
      deviation: 0,
      issues: ['척추 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  // 좌표 변환 적용
  const transformedLeftShoulder = transformLandmarkPoint(leftShoulder, devicePosition);
  const transformedRightShoulder = transformLandmarkPoint(rightShoulder, devicePosition);
  const transformedLeftHip = transformLandmarkPoint(leftHip, devicePosition);
  const transformedRightHip = transformLandmarkPoint(rightHip, devicePosition);
  
  // 척추 측면 만곡 계산 (어깨와 골반의 관계)
  const shoulderCenterX = (transformedLeftShoulder.x + transformedRightShoulder.x) / 2;
  const hipCenterX = (transformedLeftHip.x + transformedRightHip.x) / 2;
  const deviation = Math.abs(shoulderCenterX - hipCenterX) * 100; // cm로 변환
  
  // 후만증/전만증 계산 (어깨와 골반의 수직 관계)
  const shoulderCenterY = (transformedLeftShoulder.y + transformedRightShoulder.y) / 2;
  const hipCenterY = (transformedLeftHip.y + transformedRightHip.y) / 2;
  const kyphosis = Math.atan2(shoulderCenterY - hipCenterY, 0.1) * 180 / Math.PI;
  
  // 측면 만곡 계산
  const lateralCurve = Math.abs(transformedLeftShoulder.y - transformedRightShoulder.y) * 100;
  
  const issues: string[] = [];
  
  if (deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_CRITICAL) {
    issues.push('척추가 심하게 측만되어 있습니다');
  } else if (deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_WARNING) {
    issues.push('척추가 측만되어 있습니다');
  }
  
  if (kyphosis > ANALYSIS_THRESHOLDS.SPINE_KYPHOSIS_CRITICAL) {
    issues.push('심한 후만증이 있습니다');
  } else if (kyphosis > ANALYSIS_THRESHOLDS.SPINE_KYPHOSIS_WARNING) {
    issues.push('후만증이 있습니다');
  }
  
  return {
    lateralCurve,
    kyphosis,
    lordosis: 0, // 요추 전만은 별도 계산 필요
    deviation,
    issues,
  };
}

// 어깨 정렬 분석 (히스테리시스 적용)
export function analyzeShoulderAlignmentWithHysteresis(
  landmarks: Pose,
  devicePosition: 'front' | 'back',
  prevStatus: '정상' | '문제 있음'
): { alignment: ShoulderAlignment, status: '정상' | '문제 있음' } {
  if (landmarks.length < 33) {
    return {
      alignment: {
        heightDifference: 0,
        rotation: 0,
        protraction: 0,
        elevation: 0,
        issues: ['어깨 랜드마크를 감지할 수 없습니다'],
      },
      status: '정상',
    };
  }
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  if (!leftShoulder || !rightShoulder) {
    return {
      alignment: {
        heightDifference: 0,
        rotation: 0,
        protraction: 0,
        elevation: 0,
        issues: ['어깨 랜드마크를 감지할 수 없습니다'],
      },
      status: '정상',
    };
  }
  const transformedLeftShoulder = transformLandmarkPoint(leftShoulder, devicePosition);
  const transformedRightShoulder = transformLandmarkPoint(rightShoulder, devicePosition);
  const heightDifference = Math.abs(transformedLeftShoulder.y - transformedRightShoulder.y) * 100;
  const rotation = Math.atan2(
    transformedRightShoulder.y - transformedLeftShoulder.y,
    transformedRightShoulder.x - transformedLeftShoulder.x
  ) * 180 / Math.PI;
  const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
  const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];
  let protraction = 0;
  if (leftElbow && rightElbow) {
    const transformedLeftElbow = transformLandmarkPoint(leftElbow, devicePosition);
    const transformedRightElbow = transformLandmarkPoint(rightElbow, devicePosition);
    const shoulderCenterX = (transformedLeftShoulder.x + transformedRightShoulder.x) / 2;
    const elbowCenterX = (transformedLeftElbow.x + transformedRightElbow.x) / 2;
    protraction = (shoulderCenterX - elbowCenterX) * 100;
  }
  const elevation = Math.min(transformedLeftShoulder.y, transformedRightShoulder.y) * 100;
  // 히스테리시스 적용
  let status = prevStatus;
  if (prevStatus === '정상' && heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_CRITICAL) {
    status = '문제 있음';
  } else if (prevStatus === '문제 있음' && heightDifference < ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_WARNING) {
    status = '정상';
  }
  const issues: string[] = [];
  if (status === '문제 있음') {
    if (heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_CRITICAL) {
      issues.push('어깨가 심하게 기울어져 있습니다');
    } else {
      issues.push('어깨가 기울어져 있습니다');
    }
  }
  if (Math.abs(rotation) > ANALYSIS_THRESHOLDS.SHOULDER_ROTATION_CRITICAL) {
    issues.push('어깨가 심하게 회전되어 있습니다');
  } else if (Math.abs(rotation) > ANALYSIS_THRESHOLDS.SHOULDER_ROTATION_WARNING) {
    issues.push('어깨가 회전되어 있습니다');
  }
  return {
    alignment: {
      heightDifference,
      rotation,
      protraction,
      elevation,
      issues,
    },
    status,
  };
}

// 머리/목 정렬 분석
export function analyzeHeadNeckAlignment(
  landmarks: Pose,
  devicePosition: 'front' | 'back'
): HeadNeckAlignment {
  if (landmarks.length < 33) {
    return {
      forwardHead: 0,
      neckAngle: 0,
      headTilt: 0,
      issues: ['머리/목 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  
  if (!nose || !leftEar || !rightEar || !leftShoulder || !rightShoulder) {
    return {
      forwardHead: 0,
      neckAngle: 0,
      headTilt: 0,
      issues: ['머리/목 랜드마크를 감지할 수 없습니다'],
    };
  }
  
  // 좌표 변환 적용
  const transformedNose = transformLandmarkPoint(nose, devicePosition);
  const transformedLeftEar = transformLandmarkPoint(leftEar, devicePosition);
  const transformedRightEar = transformLandmarkPoint(rightEar, devicePosition);
  const transformedLeftShoulder = transformLandmarkPoint(leftShoulder, devicePosition);
  const transformedRightShoulder = transformLandmarkPoint(rightShoulder, devicePosition);
  
  // 전방 머리 위치 (FHP) 계산
  const shoulderCenterX = (transformedLeftShoulder.x + transformedRightShoulder.x) / 2;
  const forwardHead = (transformedNose.x - shoulderCenterX) * 100;
  
  // 목 각도 계산
  const earCenterY = (transformedLeftEar.y + transformedRightEar.y) / 2;
  const shoulderCenterY = (transformedLeftShoulder.y + transformedRightShoulder.y) / 2;
  const neckAngle = Math.atan2(earCenterY - shoulderCenterY, 0.1) * 180 / Math.PI;
  
  // 머리 기울기
  const headTilt = Math.atan2(
    transformedRightEar.y - transformedLeftEar.y,
    transformedRightEar.x - transformedLeftEar.x
  ) * 180 / Math.PI;
  
  const issues: string[] = [];
  
  if (forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_CRITICAL) {
    issues.push('머리가 심하게 앞으로 나와 있습니다');
  } else if (forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_WARNING) {
    issues.push('머리가 앞으로 나와 있습니다');
  }
  
  if (neckAngle < ANALYSIS_THRESHOLDS.NECK_ANGLE_CRITICAL) {
    issues.push('목이 심하게 굽어져 있습니다');
  } else if (neckAngle < ANALYSIS_THRESHOLDS.NECK_ANGLE_WARNING) {
    issues.push('목이 굽어져 있습니다');
  }
  
  return {
    forwardHead,
    neckAngle,
    headTilt,
    issues,
  };
}

// 전체 정렬 분석
export function analyzeOverallAlignment(
  pelvic: PelvicAlignment,
  spine: SpineAlignment,
  shoulder: ShoulderAlignment,
  headNeck: HeadNeckAlignment
): OverallAlignment {
  // 1. 균형 점수 계산 (정규화 + 로지스틱)
  const normPelvicHeight = normalizeValue(
    pelvic.heightDifference, 
    ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_CRITICAL
  );
  const normPelvicRotation = normalizeValue(
    Math.abs(pelvic.rotation), 
    ANALYSIS_THRESHOLDS.PELVIC_ROTATION_CRITICAL
  );
  const normPelvicTilt = normalizeValue(
    Math.abs(pelvic.tilt), 
    ANALYSIS_THRESHOLDS.PELVIC_TILT_CRITICAL
  );
  
  const pelvicScore = normPelvicHeight * SCORE_WEIGHTS.PELVIC_HEIGHT + 
                     normPelvicRotation * SCORE_WEIGHTS.PELVIC_ROTATION + 
                     normPelvicTilt * SCORE_WEIGHTS.PELVIC_TILT;
  
  const balanceScore = Math.max(10, Math.round(sigmoid(pelvicScore)));
  
  // 2. 대칭성 점수 계산 (정규화 + 로지스틱)
  const normShoulderHeight = normalizeValue(
    shoulder.heightDifference, 
    ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_CRITICAL
  );
  const normShoulderRotation = normalizeValue(
    Math.abs(shoulder.rotation), 
    ANALYSIS_THRESHOLDS.SHOULDER_ROTATION_CRITICAL
  );
  const normHeadTilt = normalizeValue(
    Math.abs(headNeck.headTilt), 
    15 // 머리 기울기 임계값 (15도)
  );
  
  const symmetryScore = normShoulderHeight * SCORE_WEIGHTS.SHOULDER_HEIGHT + 
                       normShoulderRotation * SCORE_WEIGHTS.SHOULDER_ROTATION + 
                       normHeadTilt * SCORE_WEIGHTS.HEAD_TILT;
  
  const symmetryScoreFinal = Math.max(10, Math.round(sigmoid(symmetryScore)));
  
  // 3. 정렬 점수 계산 (정규화 + 로지스틱)
  const normSpineDeviation = normalizeValue(
    spine.deviation, 
    ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_CRITICAL
  );
  const normKyphosis = normalizeValue(
    Math.abs(spine.kyphosis - 40), 
    20 // 후만증 편차 임계값 (20도)
  );
  const normForwardHead = normalizeValue(
    Math.abs(headNeck.forwardHead), 
    ANALYSIS_THRESHOLDS.FORWARD_HEAD_CRITICAL
  );
  
  const alignmentScore = normSpineDeviation * SCORE_WEIGHTS.SPINE_DEVIATION + 
                        normKyphosis * SCORE_WEIGHTS.SPINE_KYPHOSIS + 
                        normForwardHead * SCORE_WEIGHTS.FORWARD_HEAD;
  
  const alignmentScoreFinal = Math.max(10, Math.round(sigmoid(alignmentScore)));
  
  const issues: string[] = [
    ...pelvic.issues,
    ...spine.issues,
    ...shoulder.issues,
    ...headNeck.issues,
  ];
  
  return {
    balanceScore: balanceScore,
    symmetryScore: symmetryScoreFinal,
    alignmentScore: alignmentScoreFinal,
    issues,
  };
}

// 보상 패턴 감지
export function detectCompensationPatterns(
  pelvic: PelvicAlignment,
  spine: SpineAlignment,
  shoulder: ShoulderAlignment,
  headNeck: HeadNeckAlignment
): CompensationPattern[] {
  const patterns: CompensationPattern[] = [];
  
  // 골반 보상 패턴
  if (pelvic.heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_WARNING) {
    patterns.push({
      type: 'pelvic_compensation',
      description: '골반 기울기에 의한 상부 보상',
      severity: pelvic.heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_CRITICAL ? 'severe' : 'moderate',
      affectedJoints: ['spine', 'shoulder', 'head'],
    });
  }
  
  // 척추 보상 패턴
  if (spine.deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_WARNING) {
    patterns.push({
      type: 'spine_compensation',
      description: '척추 측만에 의한 어깨 보상',
      severity: spine.deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_CRITICAL ? 'severe' : 'moderate',
      affectedJoints: ['shoulder', 'head'],
    });
  }
  
  // 어깨 보상 패턴
  if (shoulder.heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_WARNING) {
    patterns.push({
      type: 'shoulder_compensation',
      description: '어깨 기울기에 의한 머리 보상',
      severity: shoulder.heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_CRITICAL ? 'severe' : 'moderate',
      affectedJoints: ['head'],
    });
  }
  
  // 머리 보상 패턴
  if (headNeck.forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_WARNING) {
    patterns.push({
      type: 'head_compensation',
      description: '전방 머리 위치에 의한 목 보상',
      severity: headNeck.forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_CRITICAL ? 'severe' : 'moderate',
      affectedJoints: ['neck'],
    });
  }
  
  return patterns;
}

// 자세 패턴 분류
export function classifyPosturePattern(
  pelvic: PelvicAlignment,
  spine: SpineAlignment,
  shoulder: ShoulderAlignment,
  headNeck: HeadNeckAlignment,
  overall: OverallAlignment
): PosturePattern {
  // A형: 골반 좌우 경사 + 어깨 회전형
  if (pelvic.heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_WARNING &&
      Math.abs(shoulder.rotation) > ANALYSIS_THRESHOLDS.SHOULDER_ROTATION_WARNING) {
    return PosturePattern.TYPE_A;
  }
  
  // B형: 전방경사 + FHP (전형적 앉은 자세형)
  if (pelvic.tilt > ANALYSIS_THRESHOLDS.PELVIC_TILT_WARNING &&
      headNeck.forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_WARNING) {
    return PosturePattern.TYPE_B;
  }
  
  // C형: 편측 압박 + 요측만 + 어깨 내림
  if (spine.deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_WARNING &&
      shoulder.heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_WARNING) {
    return PosturePattern.TYPE_C;
  }
  
  // D형: 군인형 자세 (과도한 후방 정렬)
  if (spine.kyphosis < 30 && headNeck.forwardHead < -2) {
    return PosturePattern.TYPE_D;
  }
  
  // E형: 정상 자세
  if (overall.balanceScore > ANALYSIS_THRESHOLDS.BALANCE_SCORE_WARNING &&
      overall.symmetryScore > ANALYSIS_THRESHOLDS.SYMMETRY_SCORE_WARNING) {
    return PosturePattern.TYPE_E;
  }
  
  return PosturePattern.UNKNOWN;
}

// 종합 문제점 분석
export function analyzeIssues(
  pelvic: PelvicAlignment,
  spine: SpineAlignment,
  shoulder: ShoulderAlignment,
  headNeck: HeadNeckAlignment,
  overall: OverallAlignment
): string[] {
  const issues: string[] = [];
  
  // 골반 문제
  if (pelvic.heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_CRITICAL) {
    issues.push('골반이 심하게 기울어져 있습니다');
  } else if (pelvic.heightDifference > ANALYSIS_THRESHOLDS.PELVIC_HEIGHT_DIFF_WARNING) {
    issues.push('골반이 기울어져 있습니다');
  }
  
  // 척추 문제
  if (spine.deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_CRITICAL) {
    issues.push('척추가 심하게 측만되어 있습니다');
  } else if (spine.deviation > ANALYSIS_THRESHOLDS.SPINE_LATERAL_CURVE_WARNING) {
    issues.push('척추가 측만되어 있습니다');
  }
  
  // 어깨 문제
  if (shoulder.heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_CRITICAL) {
    issues.push('어깨가 심하게 기울어져 있습니다');
  } else if (shoulder.heightDifference > ANALYSIS_THRESHOLDS.SHOULDER_HEIGHT_DIFF_WARNING) {
    issues.push('어깨가 기울어져 있습니다');
  }
  
  // 머리/목 문제
  if (headNeck.forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_CRITICAL) {
    issues.push('머리가 심하게 앞으로 나와 있습니다');
  } else if (headNeck.forwardHead > ANALYSIS_THRESHOLDS.FORWARD_HEAD_WARNING) {
    issues.push('머리가 앞으로 나와 있습니다');
  }
  
  // 전체 문제
  if (overall.balanceScore < ANALYSIS_THRESHOLDS.BALANCE_SCORE_CRITICAL) {
    issues.push('전체적인 균형이 심각하게 좋지 않습니다');
  } else if (overall.balanceScore < ANALYSIS_THRESHOLDS.BALANCE_SCORE_WARNING) {
    issues.push('전체적인 균형이 좋지 않습니다');
  }
  
  return issues;
}

// 종합 권장사항 생성
export function generateRecommendations(
  pelvic: PelvicAlignment,
  spine: SpineAlignment,
  shoulder: ShoulderAlignment,
  headNeck: HeadNeckAlignment,
  posturePattern: PosturePattern,
  compensationPatterns: CompensationPattern[]
): string[] {
  const recommendations: string[] = [];
  
  // 자세 패턴별 권장사항
  switch (posturePattern) {
    case PosturePattern.TYPE_A:
      recommendations.push('골반 기울기를 먼저 교정해주세요');
      recommendations.push('어깨 회전을 수평으로 맞춰주세요');
      break;
    case PosturePattern.TYPE_B:
      recommendations.push('골반 전방경사를 교정해주세요');
      recommendations.push('머리를 뒤로 당겨주세요');
      break;
    case PosturePattern.TYPE_C:
      recommendations.push('편측 압박을 줄여주세요');
      recommendations.push('어깨 높이를 맞춰주세요');
      break;
    case PosturePattern.TYPE_D:
      recommendations.push('과도한 후방 정렬을 완화해주세요');
      break;
    case PosturePattern.TYPE_E:
      recommendations.push('현재 자세를 유지해주세요');
      break;
  }
  
  // 보상 패턴별 권장사항
  compensationPatterns.forEach(pattern => {
    switch (pattern.type) {
      case 'pelvic_compensation':
        recommendations.push('골반 기울기 교정 운동을 해주세요');
        break;
      case 'spine_compensation':
        recommendations.push('척추 측만 교정 운동을 해주세요');
        break;
      case 'shoulder_compensation':
        recommendations.push('어깨 기울기 교정 운동을 해주세요');
        break;
      case 'head_compensation':
        recommendations.push('목 스트레칭을 해주세요');
        break;
    }
  });
  
  return recommendations;
}

// 방향별 분석 조정
export function adjustAnalysisForOrientation(
  result: PoseAnalysisResult,
  orientation: BodyOrientation
): PoseAnalysisResult {
  // 좌측/우측면에서는 일부 분석을 조정
  if (orientation === 'left' || orientation === 'right') {
    return {
      ...result,
      kinematicChain: {
        ...result.kinematicChain,
        shoulder: {
          ...result.kinematicChain.shoulder,
          rotation: result.kinematicChain.shoulder.rotation * 0.5,
        },
      },
    };
  }
  
  return result;
}

// 메인 분석 함수 - 키네마틱 체인 기반
export function analyzePose(
  landmarks: Pose[],
  orientation: BodyOrientation,
  devicePosition: 'front' | 'back' = 'back',
  prevShoulderStatus: '정상' | '문제 있음' = '정상'
): PoseAnalysisResult & { shoulderStatus: '정상' | '문제 있음' } {
  // 입력 검증
  if (!landmarks || landmarks.length === 0) {
    return {
      shoulderAngle: 0,
      shoulderSymmetry: 0,
      postureScore: 0,
      kinematicChain: {
        pelvic: { heightDifference: 0, rotation: 0, tilt: 0, isLevel: true, issues: [] },
        spine: { lateralCurve: 0, kyphosis: 0, lordosis: 0, deviation: 0, issues: [] },
        shoulder: { heightDifference: 0, rotation: 0, protraction: 0, elevation: 0, issues: [] },
        headNeck: { forwardHead: 0, neckAngle: 0, headTilt: 0, issues: [] },
        overall: { balanceScore: 0, symmetryScore: 0, alignmentScore: 0, issues: [] },
      },
      posturePattern: PosturePattern.UNKNOWN,
      compensationPatterns: [],
      issues: ['포즈가 감지되지 않았습니다'],
      recommendations: ['카메라 앞에 서주세요'],
      shoulderStatus: prevShoulderStatus,
    };
  }
  
  // 첫 번째 포즈만 분석
  const firstPose = landmarks[0];
  if (!firstPose || firstPose.length < 33) {
    return {
      shoulderAngle: 0,
      shoulderSymmetry: 0,
      postureScore: 0,
      kinematicChain: {
        pelvic: { heightDifference: 0, rotation: 0, tilt: 0, isLevel: true, issues: [] },
        spine: { lateralCurve: 0, kyphosis: 0, lordosis: 0, deviation: 0, issues: [] },
        shoulder: { heightDifference: 0, rotation: 0, protraction: 0, elevation: 0, issues: [] },
        headNeck: { forwardHead: 0, neckAngle: 0, headTilt: 0, issues: [] },
        overall: { balanceScore: 0, symmetryScore: 0, alignmentScore: 0, issues: [] },
      },
      posturePattern: PosturePattern.UNKNOWN,
      compensationPatterns: [],
      issues: ['포즈가 감지되지 않았습니다'],
      recommendations: ['카메라 앞에 서주세요'],
      shoulderStatus: prevShoulderStatus,
    };
  }
  
  // 키네마틱 체인 순서대로 분석 (좌표 변환 적용)
  const pelvic = analyzePelvicAlignment(firstPose, devicePosition);
  const spine = analyzeSpineAlignment(firstPose, devicePosition);
  const { alignment: shoulder, status: shoulderStatus } = analyzeShoulderAlignmentWithHysteresis(firstPose, devicePosition, prevShoulderStatus);
  const headNeck = analyzeHeadNeckAlignment(firstPose, devicePosition);
  const overall = analyzeOverallAlignment(pelvic, spine, shoulder, headNeck);
  
  // 보상 패턴 감지
  const compensationPatterns = detectCompensationPatterns(pelvic, spine, shoulder, headNeck);
  
  // 자세 패턴 분류
  const posturePattern = classifyPosturePattern(pelvic, spine, shoulder, headNeck, overall);
  
  // 종합 문제점 및 권장사항
  const issues = analyzeIssues(pelvic, spine, shoulder, headNeck, overall);
  const recommendations = generateRecommendations(pelvic, spine, shoulder, headNeck, posturePattern, compensationPatterns);
  
  // 기존 호환성을 위한 값들 계산
  const shoulderAngle = Math.abs(shoulder.rotation);
  const shoulderSymmetry = Math.max(0, 100 - (shoulder.heightDifference * 50));
  const shoulderSymmetryInt = Math.floor(shoulderSymmetry);
  const postureScore = Math.round((overall.balanceScore + overall.symmetryScore + overall.alignmentScore) / 3);
  
  let result: PoseAnalysisResult & { shoulderStatus: '정상' | '문제 있음' } = {
    shoulderAngle,
    shoulderSymmetry: shoulderSymmetryInt,
    postureScore,
    kinematicChain: {
      pelvic,
      spine,
      shoulder,
      headNeck,
      overall,
    },
    posturePattern,
    compensationPatterns,
    issues,
    recommendations,
    shoulderStatus,
  };
  
  // 방향별 조정
  result = adjustAnalysisForOrientation(result, orientation);
  
  return result;
} 