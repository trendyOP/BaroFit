/**
 * =====================================================
 * 💧 useWaterPhotos 훅 사용처 분석 (2025.01 현재)
 * =====================================================
 * 
 * 📋 현재 쿼리 키 패턴: ["water-photo", userId, consumedAt]
 * 🎯 목표 표준 패턴: 사용자 기반 패턴 유지 (사진 저장소 특성상 적절)
 * 
 * 📁 사용처 상세 분석:
 * 
 * ⚠️ 실제 활성 사용처: 현재 없음 (구현되어 있지만 미사용)
 * 
 * 🔍 잠재적 사용처 (향후 구현 예정):
 * - 물 섭취 기록 시 사진 첨부 (음료 사진)
 * - WaterIntakeBottomSheet에서 음료 사진 업로드/조회
 * - 물 섭취 통계에서 사진 갤러리
 * - 음료 종류별 사진 관리
 * 
 * 📋 쿼리 키 패턴 분석:
 * - GET: ["water-photo", userId, consumedAt] - 특정 음료 섭취 시간의 사진들
 * - 사용자 기반 스토리지: /water/userId/consumedAt/fileName.png
 * - 무효화: 특정 사용자의 특정 음료 섭취 시간 사진만 무효화 (적절함)
 * 
 * ✅ 현재 장점:
 * 1. 사용자별 데이터 격리 잘 구현
 * 2. 음료 섭취 시간 기반 파일 구조 명확
 * 3. 완전한 CRUD 기능: 업로드, 조회, 이동, 삭제
 * 4. Base64 처리 및 파일 형식 통일 (PNG)
 * 5. 중복 파일 방지 로직 구현
 * 6. common.ts 함수 활용으로 일관성 유지
 * 7. 파일명 처리 로직 견고함 (URL/파일명 분리)
 * 
 * ⚠️ 현재 문제점:
 * 1. 실제 사용처 없음 - 구현되어 있지만 물 섭취 플로우에서 미활용
 * 2. 사용 시나리오 불분명 (물 사진이 필요한지 의문)
 * 3. 파일 이동 로직의 복잡성
 * 
 * 🎯 마이그레이션 우선순위: 낮음 (사용처가 없어서 영향도 낮음)
 * - 사용자 기반 패턴은 사진 저장소 특성에 맞음
 * - 실제 필요성 검토 후 활용 여부 결정
 * - 다른 사진 훅들과 일관성 유지
 * 
 * 📝 향후 계획:
 * - 물 섭취 기록에 사진 기능 필요성 검토
 * - 음료 종류별 사진 데이터베이스 구축 시 활용 고려
 * - 사용자 커스텀 음료 등록 기능 시 사진 활용
 * =====================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient } from "~/lib/supabase"
import { _getFiles, storageUrl, generateRandomString } from "./common"
import { decode } from "base64-arraybuffer"
import { AuthHandler } from "~/lib/auth"

export const useGetWaterPhotoQuery = (userId?: string, consumedAt?: string) => {
    return useQuery({
        queryKey: ["water-photo", userId, consumedAt],
        queryFn: async () => {
            if (!userId || !consumedAt) {
                throw new Error("userId and consumedAt are required")
            }
            const normalizedConsumedAt = consumedAt.endsWith("Z") ? consumedAt.slice(0, -1) : consumedAt;

            const files = await _getFiles("water", `${userId}/${normalizedConsumedAt}`)
            console.log("🔍 물 사진 조회", `${storageUrl}/water/${userId}/${normalizedConsumedAt}`)
            console.log("🔍 물 사진 조회", files)
            return files?.map((file)=>{
                return {
                    fullPath: `${storageUrl}/water/${userId}/${normalizedConsumedAt}/${file}`,
                    fileName: file
                }
            }) || []
        },
        enabled: !!userId && !!consumedAt,
        staleTime: 1000 * 60 * 5
    })
}

export const useMoveWaterPhotoMutation = () => {
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
            const files = await _getFiles("water", `${userId}/${fromConsumedAt}`)
            // move files to toConsumedAt
            if (!files) {
                return false
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const responses = await Promise.all(files.map(async (file)=>{
                return await supabase
                    .storage
                    .from("water")
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

export const useUploadWaterPhotosMutation = () => {
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
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
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

            const responses = await Promise.all(arrayBuffers.map(async (arrayBuffer)=>{
                return await supabase
                    .storage
                    .from("water")
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
                queryKey: ["water-photo", variables.userId, variables.consumedAt]
            })
        }
    })
}

export const useDeleteWaterPhotoMutation = () => {
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
            console.log('drankAt', consumedAt)
            const normalizedConsumedAt = consumedAt.endsWith("Z") ? consumedAt.slice(0, -1) : consumedAt;
            let normalizedFileName = fileName;
            if (normalizedFileName.startsWith("http") || normalizedFileName.startsWith("file:")) {
                normalizedFileName = normalizedFileName.split("/").pop() || "";
            }
            console.log('trying to delete', `${userId}/${normalizedConsumedAt}/${normalizedFileName}`)
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const { error } = await supabase.storage.from("water").remove([`${userId}/${normalizedConsumedAt}/${normalizedFileName}`]);
            if (error) {
                console.error(error)
                return false
            }
            return true
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["water-photo", variables.userId, variables.consumedAt]
            })
        }
    })
}