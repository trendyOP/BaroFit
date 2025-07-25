/**
 * =====================================================
 * 🎯 useTargetBodyInfo 훅 사용처 분석 (2025.01 현재)
 * =====================================================
 * 
 * 📋 현재 쿼리 키 패턴: ["targetWeight", "recent", dateKey]
 * 🎯 목표 표준 패턴: ["target", "body", "recent", dateKey] (일관성 개선)
 * 
 * 📁 사용처 상세 분석:
 * 
 * ⚠️ 실제 활성 사용처: 제한적 (구현되어 있지만 완전히 활용되지 않음)
 * 
 * 🔍 잠재적 사용처 (향후 구현 예정):
 * - 목표 체중 설정 페이지
 * - 체중 진행률 계산 (현재 체중 대비 목표 체중)
 * - 홈 화면에서 목표 달성률 표시
 * - 체중 관리 조언 제공
 * 
 * 📋 쿼리 키 패턴 분석:
 * - GET: ["targetWeight", "recent", dateKey] - 특정 날짜 이전 최근 목표 체중
 * - 무효화: predicate 함수로 "targetWeight" 포함 쿼리 모두 무효화
 * - 특징: before_date 파라미터로 과거 목표 조회 (시계열 데이터)
 * 
 * ✅ 현재 장점:
 * 1. 시계열 목표 관리 구조 잘 설계됨 (before_date 활용)
 * 2. 무효화 로직 견고함 (predicate 함수 사용)
 * 3. 로딩 상태 통합 관리
 * 4. ts-rest-contract 타입 완전 활용
 * 5. 에러 처리 적절
 * 6. onSuccess 콜백 지원
 * 
 * ⚠️ 현재 문제점:
 * 1. 쿼리 키 일관성: "targetWeight"인데 다른 target 훅들과 패턴 다름
 * 2. 활용도 낮음: 구현되어 있지만 실제 사용처 부족
 * 3. 네이밍 혼란: "targetWeight"인데 실제로는 bodyInfo 전체 관리
 * 4. 목표 체중만이 아닌 다른 목표 정보도 포함 가능성
 * 
 * 🎯 마이그레이션 우선순위: 낮음 (기능 자체가 미완성)
 * 1. 쿼리 키 일관성: ["target", "body", "recent", dateKey]로 변경 고려
 * 2. 실제 사용처 구현 후 최적화
 * 3. 다른 target 훅들과 패턴 통일
 * 
 * 📝 향후 계획:
 * - 목표 설정 UI 구현 시 완전한 활용
 * - 체중 진행률 계산 기능 구현
 * - 목표 달성 알림 기능 연동
 * - useBodyInfo와 연동하여 목표 대비 현재 상태 분석
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '~/lib/mmkv';
import { dateUtils, bodyInfoTypes } from 'fitlyever-ts-rest-contract';
import { client } from '~/lib/api';
import { useAuth } from '~/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const useTargetBodyInfo = (date: Date = new Date()) => {
  const queryClient = useQueryClient();
  const dateKey = dateUtils.getDateKeyFromDate(date)
  const [targetBodyInfo, setTargetBodyInfo] = useState<bodyInfoTypes.GetBodyInfoResponse | null>(null);
  const { isAuthenticated } = useAuth();
  const { 
    data: targetBodyInfoData, 
    isLoading: isLoadingTargetBodyInfo, 
    isFetching: isFetchingTargetBodyInfo,
    refetch: refetchTargetBodyInfo
  } = client.bodyInfo.getRecentTargetBodyInfo.useQuery(
    ["targetWeight", "recent", dateKey],
    {
      query: {
        before_date: dateKey
      }
    },
    {
      enabled: isAuthenticated && !!dateKey,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 60 * 5
    }
  )

  useEffect(()=>{
    if (targetBodyInfoData) {
      setTargetBodyInfo(targetBodyInfoData.body);
    }
  },[targetBodyInfoData])

  const {mutate: updateTargetBodyInfo, isLoading: isSettingTargetBodyInfo} = client.bodyInfo.setTargetBodyInfo.useMutation()

  const saveTargetBodyInfo = (targetBodyInfo: Partial<bodyInfoTypes.CreateBodyInfoRequest>, onSuccess?: () => void ) => {
    if (targetBodyInfo) {
      updateTargetBodyInfo({
        body: {
          ...targetBodyInfo,
          date: dateKey
        }
      },{
        onSuccess: () => {
          queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey;
              return Array.isArray(queryKey) && 
                     queryKey.some(key => typeof key === 'string' && key.includes('targetWeight'));
            }
          });
          
          refetchTargetBodyInfo();
          onSuccess?.();
        }
      })
    }
  }
  
  return {
    targetBodyInfo,
    isLoading: isLoadingTargetBodyInfo || isSettingTargetBodyInfo || isFetchingTargetBodyInfo,
    saveTargetBodyInfo,
    isSettingTargetBodyInfo,
    isLoadingTargetBodyInfo: isLoadingTargetBodyInfo || isFetchingTargetBodyInfo
  };
};

export default useTargetBodyInfo; 