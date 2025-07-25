/**
 * =====================================================
 * ⚖️ useWeightPhotos 훅 사용처 분석 (2025.01 현재)
 * =====================================================
 * 
 * 📋 현재 쿼리 키 패턴: ["weight-photo", userId, date]
 * 🎯 목표 표준 패턴: 사용자 기반 패턴 유지 (사진 저장소 특성상 적절)
 * 
 * 📁 사용처 상세 분석:
 * 
 * ⚠️ 실제 활성 사용처: 현재 없음 (구현되어 있지만 미사용)
 * 
 * 🔍 잠재적 사용처 (향후 구현 예정):
 * - 체중 측정 시 사진 첨부 (체중계 사진, 몸매 사진)
 * - WeightQuickBottomSheet에서 체중 사진 업로드/조회
 * - 체중 변화 비교를 위한 사진 갤러리
 * - 체중 통계에서 변화 과정 사진 표시
 * 
 * 📋 쿼리 키 패턴 분석:
 * - GET: ["weight-photo", userId, date] - 특정 날짜의 체중 사진들
 * - 사용자 기반 스토리지: /weight/userId/date/fileName.png
 * - 무효화: 특정 사용자의 특정 날짜 체중 사진만 무효화 (적절함)
 * 
 * ✅ 현재 장점:
 * 1. 사용자별 데이터 격리 완벽 구현
 * 2. 날짜 기반 파일 구조 명확 (다른 사진들과 달리 시간이 아닌 날짜 사용)
 * 3. 완전한 CRUD 기능: 업로드, 조회, 이동, 삭제
 * 4. Base64 처리 및 파일 형식 통일 (PNG)
 * 5. 중복 파일 방지 로직 구현
 * 6. common.ts 함수 활용으로 일관성 유지
 * 7. 체중 데이터 특성에 맞는 날짜 기반 구조
 * 
 * ⚠️ 현재 문제점:
 * 1. 실제 사용처 없음 - 구현되어 있지만 체중 기록 플로우에서 미활용
 * 2. 체중 사진의 프라이버시 이슈 고려 필요
 * 3. 파일 이동 로직 (날짜 변경 시 처리)
 * 
 * 🎯 마이그레이션 우선순위: 낮음 (사용처가 없어서 영향도 낮음)
 * - 사용자 기반 패턴은 사진 저장소 특성에 맞음
 * - 실제 사용처 구현 시점에 맞춰 활용
 * - 체중 데이터와의 연동 고려
 * 
 * 📝 향후 계획:
 * - 체중 기록에 사진 기능 필요성 검토
 * - 프라이버시 보호 정책 수립
 * - 체중 변화 비교 기능 구현 시 활용
 * - AI 기반 체형 분석 기능과 연동 고려
 * =====================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createSupabaseClient } from "~/lib/supabase"
import { _getFiles, storageUrl, generateRandomString } from "./common"
import { decode } from "base64-arraybuffer"
import { AuthHandler } from "~/lib/auth"

export const useGetWeightPhotoQuery = (userId?: string, date?: string) => {
    return useQuery({
        queryKey: ["weight-photo", userId, date],
        queryFn: async () => {
            if (!userId || !date) {
                throw new Error("userId and date are required")
            }

            const files = await _getFiles("weight", `${userId}/${date}`)
            console.log("🔍 체중 사진 조회", `${storageUrl}/weight/${userId}/${date}`)
            console.log("🔍 체중 사진 조회", files)
            return files?.map((file)=>{
                return {
                    fullPath: `${storageUrl}/weight/${userId}/${date}/${file}`,
                    fileName: file
                }
            }) || []
        },
        enabled: !!userId && !!date,
        staleTime: 1000 * 60 * 5
    })
}

export const useMoveWeightPhotoMutation = () => {
    return useMutation({
        mutationFn: async({
            userId,
            fromDate,
            toDate
        }: {
            userId: string,
            fromDate: string,
            toDate: string
        }) => {
            if (!userId || !fromDate || !toDate) {
                throw new Error("userId, fromDate, toDate are required")
            }
            // get all files from fromDate
            const files = await _getFiles("weight", `${userId}/${fromDate}`)
            // move files to toDate
            if (!files) {
                return false
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const responses = await Promise.all(files.map(async (file)=>{
                return await supabase
                    .storage
                    .from("weight")
                    .move(`${userId}/${fromDate}/${file}`, `${userId}/${toDate}/${file}`)
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

export const useUploadWeightPhotosMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            date,
            base64
        }: {
            userId: string,
            date: string,
            base64: string[] | string
        }) => {
            if (!userId || !date || !base64) {
                throw new Error("userId or date or base64 is required")
            }
            const modifiedDate = date.endsWith("Z") ? date.slice(0, -1) : date
            let base64Array = Array.isArray(base64) ? base64 : [base64]
            base64Array = base64Array.filter((base64)=>{
                return base64 !== "" && base64 !== null && base64 !== undefined &&
                       !base64.startsWith("http") && !base64.startsWith("file:") &&
                       base64.length > 100
              })

            console.log("🔍 체중 사진 업로드", base64Array)

            const arrayBuffers = base64Array.map((base64)=>{
                const cleanBase64 = base64.startsWith('data:')? base64.split(',')[1] : base64
                return {
                    buffer: decode(cleanBase64),
                    fileName: `${userId}/${modifiedDate}/${generateRandomString()}.png`
                }
            })

            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const responses = await Promise.all(arrayBuffers.map(async (arrayBuffer)=>{
                return await supabase
                    .storage
                    .from("weight")
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
                queryKey: ["weight-photo", variables.userId, variables.date]
            })
        }
    })
}

export const useDeleteWeightPhotoMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            date,
            fileName
        }: {
            userId: string,
            date: string,
            fileName: string
        }) => {
            if (date.endsWith("Z")) {
                date = date.slice(0, -1)
            }
            if (fileName.startsWith("http") || fileName.startsWith("file:")) {
                fileName = fileName.split("/").pop() || ""
            }
            const tokenObj = await AuthHandler.getRefreshedToken()
            const supabase = createSupabaseClient(tokenObj?.accessToken)
            const { data, error } = await supabase.storage.from("weight").remove([`${userId}/${date}/${fileName}`])    
            if (error) {
                console.error(error)
                return false
            }
            return true
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ["weight-photo", variables.userId, variables.date]
            })
        }
    })
}