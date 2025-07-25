/**
 * =====================================================
 * 🔥 useCaloriePhotos 훅 사용처 분석 (2025.01 현재)
 * =====================================================
 * 
 * 📋 현재 쿼리 키 패턴: ["calorie-photo", userId, consumedAt]
 * 🎯 목표 표준 패턴: 사용자 기반 패턴 유지 (사진 저장소 특성상 적절)
 * 
 * 📁 사용처 상세 분석:
 * 
 * ⚠️ 실제 활성 사용처: 현재 없음 (구현되어 있지만 미사용)
 * 
 * 🔍 잠재적 사용처 (향후 구현 예정):
 * - 칼로리 소모 기록 시 사진 첨부
 * - 운동 기록 페이지에서 운동 사진 관리
 * - BurnBottomSheet에서 사진 업로드/조회
 * - 통계 페이지에서 운동 사진 갤러리
 * 
 * 📋 쿼리 키 패턴 분석:
 * - GET: ["calorie-photo", userId, consumedAt] - 특정 시간의 칼로리 사진들
 * - 사용자 기반 스토리지: /calories/userId/consumedAt/fileName.png
 * - 무효화: 특정 사용자의 특정 시간 사진만 무효화 (적절함)
 * 
 * ✅ 현재 장점:
 * 1. 사용자별 데이터 격리 잘 구현
 * 2. 시간 기반 파일 구조 명확
 * 3. Base64 업로드, 파일 이동, 삭제 기능 완비
 * 4. 중복 파일 방지 로직 구현 (generateRandomString)
 * 
 * ⚠️ 현재 문제점:
 * 1. 실제 사용처 없음 - 구현되어 있지만 활용되지 않음
 * 2. useFile.ts와 기능 중복 가능성
 * 3. common.ts 함수 활용으로 일관성은 있음
 * 
 * 🎯 마이그레이션 우선순위: 낮음 (사용처가 없어서 영향도 낮음)
 * - 실제 사용처 구현 시점에 맞춰 표준화 적용
 * - 사진 관련 훅들의 일관성 유지
 * - 사용자 기반 패턴은 사진 도메인 특성상 적절하므로 유지
 * 
 * 📝 향후 계획:
 * - 운동 기록 기능 활성화 시 함께 완전한 구현
 * - BurnBottomSheet 구현 시 CRUD 기능 테스트
 * - 통계 페이지에 운동 사진 추가 시 적용
 * =====================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient } from "~/lib/supabase"
import { _getFiles, storageUrl, generateRandomString } from "./common"
import { decode } from "base64-arraybuffer"
import { AuthHandler } from "~/lib/auth"

export const useGetCaloriePhotoQuery = (userId?: string, consumedAt?: string) => {
    return useQuery({
        queryKey: ["calorie-photo", userId, consumedAt],
        queryFn: async () => {
            if (!userId || !consumedAt) {
                throw new Error("userId and consumedAt are required")
            }
            const normalizedConsumedAt = consumedAt.endsWith("Z") ? consumedAt.slice(0, -1) : consumedAt;

            const files = await _getFiles("calories", `${userId}/${normalizedConsumedAt}`)
            console.log("🔍 운동 사진 조회", `${storageUrl}/calories/${userId}/${normalizedConsumedAt}`)
            console.log("🔍 운동 사진 조회", files)
            return files?.map((file)=>{
                return {
                    fullPath: `${storageUrl}/calories/${userId}/${normalizedConsumedAt}/${file}`,
                    fileName: file
                }
            }) || []
        },
        enabled: !!userId && !!consumedAt,
        staleTime: 1000 * 60 * 5
    })
}

export const useMoveCaloriePhotoMutation = () => {
    return useMutation({
        mutationFn: async({
            userId,
            fromConsumedAt,
            toConsumedAt
        }: {
            userId: string,
            fromConsumedAt: string,
            toConsumedAt: string
        }) => {
            if (!userId || !fromConsumedAt || !toConsumedAt) {
                throw new Error("userId, fromConsumedAt, toConsumedAt are required")
            }
            // get all files from fromConsumedAt
            const files = await _getFiles("calories", `${userId}/${fromConsumedAt}`)
            // move files to toConsumedAt
            if (!files) {
                return false
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const responses = await Promise.all(files.map(async (file)=>{
                return await supabase
                    .storage
                    .from("calories")
                    .move(`${userId}/${fromConsumedAt}/${file}`, `${userId}/${toConsumedAt}/${file}`)
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

export const useUploadCaloriePhotosMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            consumedAt,
            base64
        }: {
            userId: string,
            consumedAt: string,
            base64: string[] | string
        }) => {
            if (!userId || !consumedAt || !base64) {
                throw new Error("userId or consumedAt or base64 is required")
            }
            const modifiedConsumedAt = consumedAt.endsWith("Z") ? consumedAt.slice(0, -1) : consumedAt
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
                    fileName: `${userId}/${modifiedConsumedAt}/${generateRandomString()}.png`
                }
            })
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)

            const responses = await Promise.all(arrayBuffers.map(async (arrayBuffer)=>{
                return await supabase
                    .storage
                    .from("calories")
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
                queryKey: ["calorie-photo", variables.userId, variables.consumedAt]
            })
        }
    })
}

export const useDeleteCaloriePhotoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            consumedAt,
            fileName
        }: {
            userId: string,
            consumedAt: string,
            fileName: string
        }) => {
            const normalizedConsumedAt = consumedAt.endsWith("Z") ? consumedAt.slice(0, -1) : consumedAt;
            let normalizedFileName = fileName;
            if (normalizedFileName.startsWith("http") || normalizedFileName.startsWith("file:")) {
                normalizedFileName = normalizedFileName.split("/").pop() || "";
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const { error } = await supabase.storage.from("calories").remove([`${userId}/${normalizedConsumedAt}/${normalizedFileName}`]);
            if (error) {
                console.error(error)
                return false
            }
            return true
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["calorie-photo", variables.userId, variables.consumedAt]
            })
        }
    })
}