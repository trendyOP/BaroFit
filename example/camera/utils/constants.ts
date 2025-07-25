/**
 * app/camera/utils/constants.ts
 * 
 * 카메라 관련 상수 정의
 */
import { Dimensions, Platform } from 'react-native';

// 일반 간격 및 여백
export const CONTENT_SPACING = 15;

// 줌 관련 상수
export const MAX_ZOOM_FACTOR = 10;
export const SCALE_FULL_ZOOM = 3;

// 화면 크기 (바텀시트 내 카메라 뷰 설정을 위해 필요)
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;

// 화면 비율
export const SCREEN_ASPECT_RATIO = SCREEN_HEIGHT / SCREEN_WIDTH;

// 컬러 상수
export const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparentBg: 'rgba(140, 140, 140, 0.3)',
}; 