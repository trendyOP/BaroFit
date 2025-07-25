/**
 * app/camera/hooks/use-camera-format.ts
 * 
 * 최적의 카메라 포맷을 선택하는 커스텀 훅
 */
import { useMemo } from 'react';
import { CameraDevice, CameraDeviceFormat } from 'react-native-vision-camera';

interface FormatFilter {
  fps?: number;
  videoAspectRatio?: number;
  videoResolution?: 'max' | 'high' | 'medium' | 'low';
  photoAspectRatio?: number;
  photoResolution?: 'max' | 'high' | 'medium' | 'low';
  hdr?: boolean;
}

/**
 * 최적의 카메라 포맷을 선택하는 훅
 * @param device 카메라 장치
 * @param filters 포맷 필터 조건
 * @returns 선택된 최적 포맷
 */
export default function useCameraFormat(
  device: CameraDevice | null | undefined,
  filters: FormatFilter[] = []
): CameraDeviceFormat | undefined {
  return useMemo(() => {
    if (!device) return undefined;
    
    // 장치에 사용 가능한 포맷이 없는 경우
    if (!device.formats || device.formats.length === 0) {
      return undefined;
    }
    
    // 필터링된 포맷 후보 목록
    let candidates = [...device.formats];
    
    // 각 필터 조건을 적용
    for (const filter of filters) {
      // 최소 fps 필터
      if (filter.fps !== undefined) {
        const targetFps = filter.fps;
        candidates = candidates.filter(f => f.maxFps >= targetFps);
      }
      
      // 비디오 화면비 필터
      if (filter.videoAspectRatio !== undefined) {
        const targetRatio = filter.videoAspectRatio;
        candidates = candidates.filter(f => {
          const ratio = f.videoWidth / f.videoHeight;
          // 비슷한 화면비 허용 (오차 5% 이내)
          return Math.abs(ratio - targetRatio) / targetRatio < 0.05;
        });
      }
      
      // 사진 화면비 필터
      if (filter.photoAspectRatio !== undefined) {
        const targetRatio = filter.photoAspectRatio;
        candidates = candidates.filter(f => {
          const ratio = f.photoWidth / f.photoHeight;
          // 비슷한 화면비 허용 (오차 5% 이내)
          return Math.abs(ratio - targetRatio) / targetRatio < 0.05;
        });
      }
      
      // HDR 필터
      if (filter.hdr !== undefined) {
        candidates = candidates.filter(f => 
          (filter.hdr && (f.supportsPhotoHdr || f.supportsVideoHdr)) || 
          (!filter.hdr && !(f.supportsPhotoHdr || f.supportsVideoHdr))
        );
      }
      
      // 비디오 해상도 필터
      if (filter.videoResolution) {
        const sortedByResolution = [...candidates].sort((a, b) => {
          return (b.videoWidth * b.videoHeight) - (a.videoWidth * a.videoHeight);
        });
        
        switch (filter.videoResolution) {
          case 'max':
            if (sortedByResolution.length > 0) {
              candidates = [sortedByResolution[0]];
            }
            break;
          case 'high':
            if (sortedByResolution.length >= 4) {
              candidates = [sortedByResolution[Math.floor(sortedByResolution.length / 4)]];
            } else if (sortedByResolution.length > 0) {
              candidates = [sortedByResolution[0]];
            }
            break;
          case 'medium':
            if (sortedByResolution.length > 0) {
              candidates = [sortedByResolution[Math.floor(sortedByResolution.length / 2)]];
            }
            break;
          case 'low':
            if (sortedByResolution.length > 0) {
              candidates = [sortedByResolution[sortedByResolution.length - 1]];
            }
            break;
        }
      }
      
      // 사진 해상도 필터
      if (filter.photoResolution) {
        const sortedByPhotoResolution = [...candidates].sort((a, b) => {
          return (b.photoWidth * b.photoHeight) - (a.photoWidth * a.photoHeight);
        });
        
        switch (filter.photoResolution) {
          case 'max':
            if (sortedByPhotoResolution.length > 0) {
              candidates = [sortedByPhotoResolution[0]];
            }
            break;
          case 'high':
            if (sortedByPhotoResolution.length >= 4) {
              candidates = [sortedByPhotoResolution[Math.floor(sortedByPhotoResolution.length / 4)]];
            } else if (sortedByPhotoResolution.length > 0) {
              candidates = [sortedByPhotoResolution[0]];
            }
            break;
          case 'medium':
            if (sortedByPhotoResolution.length > 0) {
              candidates = [sortedByPhotoResolution[Math.floor(sortedByPhotoResolution.length / 2)]];
            }
            break;
          case 'low':
            if (sortedByPhotoResolution.length > 0) {
              candidates = [sortedByPhotoResolution[sortedByPhotoResolution.length - 1]];
            }
            break;
        }
      }
      
      // 후보가 없으면 더 이상 필터링하지 않음
      if (candidates.length === 0) {
        return undefined;
      }
    }
    
    // 후보 중 가장 좋은 포맷 선택 (해상도와 fps를 고려)
    return candidates.reduce((prev, curr) => {
      const prevScore = 
        (prev.videoWidth * prev.videoHeight) + // 해상도 점수
        (prev.maxFps * 100) +                 // fps 점수 (가중치 부여)
        (prev.supportsPhotoHdr ? 1000 : 0);   // HDR 추가 점수
      
      const currScore = 
        (curr.videoWidth * curr.videoHeight) + 
        (curr.maxFps * 100) +
        (curr.supportsPhotoHdr ? 1000 : 0);
      
      return currScore > prevScore ? curr : prev;
    });
  }, [device, filters]);
} 