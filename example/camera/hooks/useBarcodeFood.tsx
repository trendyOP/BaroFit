import { useState, useEffect } from 'react';
import { foodTypes } from 'fitlyever-ts-rest-contract';
import { client } from '~/lib/api';

/**
 * 바코드로 식품 정보를 조회하는 커스텀 훅
 */
export function useBarcodeFood(barcode: string | null, isVisible: boolean) {
  // 상태 관리
  const [food, setFood] = useState<foodTypes.Food | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API 호출에 필요한 쿼리
  const { 
    data: barcodeFoodInfo, 
    isLoading: isBarcodeFoodInfoLoading, 
    error: barcodeFoodInfoError, 
    refetch: refetchBarcodeFoodInfo 
  } = client.food.getFoodIdWithBarcode.useQuery(
    ["food_by_barcode", barcode],
    {
      query: {
        barcode: barcode ?? ''
      }
    },
    {
      enabled: !!barcode && !!isVisible      
    }
  );

  const { 
    data: foodInfo, 
    isLoading: isFoodInfoLoading, 
    refetch: refetchFoodInfo 
  } = client.food.getFood.useQuery(
    ["food", barcodeFoodInfo?.body.food_id, barcodeFoodInfo?.body.serving_id, barcodeFoodInfo?.body.food_source],
    {
      query: {
        food_id: barcodeFoodInfo?.body.food_id,
        serving_id: barcodeFoodInfo?.body.serving_id,
        food_source: barcodeFoodInfo?.body.food_source
      }
    },
    {
      enabled: false
    }
  );

  // 로딩 상태 통합
  const isLoading = isBarcodeFoodInfoLoading || isFoodInfoLoading;
  
  // 모달이 표시될 때마다 에러 상태 초기화
  useEffect(() => {
    if (isVisible) {
      console.log('모달 표시됨, 상태 초기화');
      setError(null);
    }
  }, [isVisible]);
  
  // 바코드 정보가 있으면 식품 정보 가져오기
  useEffect(() => {
    if (barcodeFoodInfo?.body) {
      console.log('바코드로 음식 정보 찾음, 세부 정보 요청');
      refetchFoodInfo();
    }
  }, [barcodeFoodInfo?.body, refetchFoodInfo]);

  // 식품 정보가 있으면 상태 업데이트
  useEffect(() => {
    if (foodInfo) {
      console.log('음식 세부 정보 받음');
      setFood(foodInfo.body);
    }
  }, [foodInfo]);

  // API 에러 메시지 추출
  useEffect(() => {
    if (barcodeFoodInfoError) {
      console.log('바코드 음식 정보 에러:', barcodeFoodInfoError);
      // @ts-ignore - 에러 타입이 정확하지 않을 수 있으므로 무시
      const errorBody = barcodeFoodInfoError.body || {};
      
      // 디버깅을 위한 로그 추가 (간결하게)
      console.log('에러 본문:', errorBody.error || errorBody.message || 'Unknown error');
      
      if (errorBody.error) {
        console.log('에러 메시지 설정:', errorBody.error);
        setError(errorBody.error);
      } else {
        console.log('기본 에러 메시지 설정');
        setError('음식 정보를 가져오는 중 오류가 발생했습니다.');
      }
    }
  }, [barcodeFoodInfoError]);

  return { 
    food, 
    error, 
    isLoading,
    barcodeFoodInfo,
    barcodeFoodInfoError
  };
} 