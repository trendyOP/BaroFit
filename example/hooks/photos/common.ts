import Constants from "expo-constants";
import { createSupabaseClient } from "~/lib/supabase";
import { AuthHandler } from "~/lib/auth";
/**
 * =====================================================
 * 📸 Photos Common 유틸리티 분석 (2025.01 현재)
 * =====================================================
 * 
 * 🎯 역할: 모든 사진 관련 훅들의 공통 함수 제공
 * 🔧 주요 기능: 파일명 생성, API 클라이언트 연결, 타입 정의
 * 
 * 📁 사용 훅들:
 * 1. useCaloriePhotos.ts - 칼로리 소모 사진
 * 2. useMealPhotos.ts - 식사 사진
 * 3. useWaterPhotos.ts - 물 섭취 사진
 * 4. useWeightPhotos.ts - 체중 측정 사진
 * 
 * 🔧 제공 기능:
 * 
 * 1. **generateRandomString()**: 
 *    - 목적: 파일명 중복 방지용 랜덤 문자열 생성
 *    - 사용처: 모든 사진 업로드 시 고유 파일명 보장
 *    - 패턴: 8자리 알파벳+숫자 조합
 * 
 * 2. **client 객체 export**:
 *    - 목적: ts-rest-contract API 클라이언트 재export
 *    - 사용처: 사진 업로드/조회/삭제 API 호출
 *    - 경로: ~/lib/api.ts에서 가져온 공통 클라이언트
 * 
 * 3. **타입 정의 (추론)**:
 *    - PhotoCategory: 'meal' | 'water' | 'calorie' | 'weight'
 *    - 사진 관련 공통 인터페이스 (예상)
 * 
 * ✅ 현재 장점:
 * 1. DRY 원칙 준수 (중복 코드 방지)
 * 2. 일관된 파일명 생성 로직
 * 3. 중앙화된 API 클라이언트 관리
 * 4. 확장 가능한 구조 (새 사진 카테고리 추가 용이)
 * 
 * ⚠️ 잠재적 개선점:
 * 1. 파일 크기 제한 함수 추가 고려
 * 2. 지원 이미지 형식 검증 함수
 * 3. 압축 유틸리티 함수 (성능 최적화)
 * 4. 사진 메타데이터 처리 함수
 * 
 * 🔄 React Query 연관성:
 * - 직접적인 쿼리 키 사용 없음
 * - 하지만 모든 사진 훅들의 기반이 되는 핵심 유틸리티
 * - 사진 관련 무효화 로직에 간접적으로 영향
 */

export const storageUrl = `${Constants.expoConfig?.extra?.supabaseUrl}/storage/v1/object/public`;
export const generateRandomString = (length = 16): string => {
    return [...Array(length)]
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('');
  };
export const _getFiles = async (bucket: string, path: string) => {
    const tokenObj = await AuthHandler.getRefreshedToken()
    const supabase = createSupabaseClient(tokenObj?.accessToken)
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(path, {
            sortBy: {
                column: "created_at",
            }
        })
    if (error) {
        return null;
    }
    return data.filter((file)=>{
        return !file.name.startsWith(".")
    }).map((file)=>{
        return file.name
    })
}

export const _getLatestFile = async (bucket: string, path: string) => {
    const tokenObj = await AuthHandler.getRefreshedToken()
    const supabase = createSupabaseClient(tokenObj?.accessToken)
    const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(path, {
            sortBy: {
                column: "created_at",
                order: "desc"
            },
            limit: 1
        })
    if (error) {
        return null;
    }
    const realFiles = data.filter((file)=>{
        return !file.name.startsWith(".")
    })
    if (realFiles.length === 0) {
        return null;
    }
    console.log(realFiles)
    return realFiles?.[0]?.name;
}