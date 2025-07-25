/**
 * =====================================================
 * 🍽️ useMealPhotos 훅 사용처 분석 (2025.01 현재)
 * =====================================================
 * 
 * 📋 현재 쿼리 키 패턴: ["meal-photo", userId, eatenAt]
 * 🎯 목표 표준 패턴: 사용자 기반 패턴 유지 (사진 저장소 특성상 적절)
 * 
 * 📁 사용처 상세 분석:
 * 
 * ⚠️ 실제 활성 사용처: 제한적 (구현되어 있지만 완전히 활용되지 않음)
 * 
 * 🔍 잠재적 사용처 (향후 구현 예정):
 * - 식사 기록 시 사진 첨부 기능
 * - FoodTimeLineBottomSheet에서 식사 사진 업로드/조회
 * - 식사 상세 페이지에서 사진 갤러리
 * - 식사 편집 시 사진 관리 (이동, 삭제)
 * 
 * 📋 쿼리 키 패턴 분석:
 * - GET: ["meal-photo", userId, eatenAt] - 특정 식사 시간의 사진들
 * - 사용자 기반 스토리지: /meal/userId/eatenAt/fileName.png
 * - 무효화: 특정 사용자의 특정 식사 시간 사진만 무효화 (적절함)
 * 
 * ✅ 현재 장점:
 * 1. 사용자별 데이터 격리 완벽 구현
 * 2. 식사 시간 기반 파일 구조 명확
 * 3. 완전한 CRUD 기능: 업로드, 조회, 이동, 삭제
 * 4. Base64 처리 및 파일 형식 통일 (PNG)
 * 5. 중복 파일 방지 (generateRandomString)
 * 6. common.ts 함수 활용으로 일관성 유지
 * 
 * ⚠️ 현재 문제점:
 * 1. 활용도 낮음 - 구현되어 있지만 주요 식사 기록 플로우에서 미사용
 * 2. useFile.ts와 일부 기능 중복 (식사 사진 관련)
 * 3. 파일 이동 로직이 복잡함 (시간 변경 시 처리)
 * 
 * 🎯 마이그레이션 우선순위: 낮음 (사진 도메인 특성상 현재 패턴 적절)
 * - 사용자 기반 패턴은 사진 저장소 특성에 맞음
 * - 실제 사용처 확대 시점에 맞춰 최적화
 * - 다른 사진 훅들과 일관성 유지
 * 
 * 📝 향후 계획:
 * - 식사 기록 UI에 사진 기능 통합
 * - 식사 편집 시 사진 이동/삭제 기능 활성화
 * - 사진 미리보기 및 갤러리 기능 구현
 * =====================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient} from "~/lib/supabase"
import { _getFiles, storageUrl, generateRandomString } from "./common"
import { decode } from "base64-arraybuffer"
import { AuthHandler } from "~/lib/auth"
import { queryKeys } from '~/lib/queryKeys'

export const useGetMealPhotoQuery = (userId?: string, eatenAt?: string) => {
    return useQuery({
        queryKey: userId && eatenAt ? queryKeys.file.mealPhoto(userId, eatenAt) : ["file", "meal-photo", "disabled"],
        queryFn: async () => {
            if (!userId || !eatenAt) {
                throw new Error("userId and eatenAt are required")
            }
            const modifiedEatenAt = eatenAt.endsWith("Z") ? eatenAt.slice(0, -1) : eatenAt;

            const files = await _getFiles("meal", `${userId}/${modifiedEatenAt}`)
            console.log("🔍 식사 사진 조회", `${storageUrl}/meal/${userId}/${modifiedEatenAt}`)
            console.log("🔍 식사 사진 조회", files)
            return files?.map((file)=>{
                return {
                    fullPath: `${storageUrl}/meal/${userId}/${modifiedEatenAt}/${file}`,
                    fileName: file
                }
            }) || []
        },
        enabled: !!userId && !!eatenAt,
        staleTime: 1000 * 60 * 5
    })
}

export const useMoveMealPhotoMutation = () => {
    return useMutation({
        mutationFn: async({
            userId,
            fromEatenAt,
            toEatenAt
        }: {
            userId: string,
            fromEatenAt: string,
            toEatenAt: string
        }) => {
            if (!userId || !fromEatenAt || !toEatenAt) {
                throw new Error("userId, fromEatenAt, toEatenAt are required")
            }
            // get all files from fromEatenAt
            const files = await _getFiles("meal", `${userId}/${fromEatenAt}`)
            // move files to toEatenAt
            if (!files) {
                return false
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const responses = await Promise.all(files.map(async (file)=>{
                return await supabase
                    .storage
                    .from("meal")
                    .move(`${userId}/${fromEatenAt}/${file}`, `${userId}/${toEatenAt}/${file}`)
            }))
            const responsesWithErrors = responses.filter((response)=>{
                return response.error
            })
            if (responsesWithErrors.length > 0) {
                return false
            }
            return true
        }
    })
}

export const useUploadMealPhotosMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            eatenAt,
            base64
        }: {
            userId: string,
            eatenAt: string,
            base64: string[] | string
        }) => {
            if (!userId || !eatenAt || !base64) {
                throw new Error("userId or eatenAt or base64 is required")
            }
            const modifiedEatenAt = eatenAt.endsWith("Z") ? eatenAt.slice(0, -1) : eatenAt
            let base64Array = Array.isArray(base64) ? base64 : [base64]
            base64Array = base64Array.filter((base64)=>{
                return base64 !== "" && base64 !== null && base64 !== undefined &&
                       !base64.startsWith("http") && !base64.startsWith("file:") &&
                       base64.length > 100
              })
            const arrayBuffers = base64Array.map((base64)=>{
                const cleanBase64 = base64.startsWith('data:')? base64.split(',')[1] : base64
                return {
                    buffer: decode(cleanBase64),
                    fileName: `${userId}/${modifiedEatenAt}/${generateRandomString()}.png`
                }
            })
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)

            const responses = await Promise.all(arrayBuffers.map(async (arrayBuffer)=>{
                return await supabase
                    .storage
                    .from("meal")
                    .upload(arrayBuffer.fileName, arrayBuffer.buffer, {
                        contentType: "image/png",
                        upsert: true
                    })
            }))

            const responsesWithErrors = responses.filter((response)=>{
                return response.error
            })

            if (responsesWithErrors.length > 0) {
                return false
            }

            return true
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.file.mealPhoto(variables.userId, variables.eatenAt)
            })
        }
    })
}

export const useDeleteMealPhotoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            eatenAt,
            fileName
        }: {
            userId: string,
            eatenAt: string,
            fileName: string
        }) => {
            if (eatenAt.endsWith("Z")) {
                eatenAt = eatenAt.slice(0, -1)
            }
            if (fileName.startsWith("http") || fileName.startsWith("file:")) {
                fileName = fileName.split("/").pop() || ""
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const { data, error } = await supabase.storage.from("meal").remove([`${userId}/${eatenAt}/${fileName}`])    
            if (error) {
                console.error(error)
                return false
            }
            return true
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.file.mealPhoto(variables.userId, variables.eatenAt)
            })
        }
    })
}