/**
 * app/camera/views/BarcodeResultModal/index.tsx
 * 
 * 바코드 스캔 결과를 표시하는 모달 컴포넌트 (메인 진입점)
 */
import React, { useState } from 'react';
import { Modal, TouchableWithoutFeedback } from 'react-native';
import { foodTypes } from 'fitlyever-ts-rest-contract';
import { useAuth } from '~/contexts/AuthContext';
import { useUploadFoodProductPhotoMutation, useGetFoodProductPhotosQuery } from '~/hooks/useFile';
import { useBarcodeFood } from '~/app/camera/hooks/useBarcodeFood';
import { useColorScheme } from '~/lib/useColorScheme';

// 컴포넌트 import
import BarcodeLoadingContent from './BarcodeLoadingContent';
import BarcodeErrorContent from './BarcodeErrorContent';
import BarcodeUploadContent from './BarcodeUploadContent';
import BarcodeResultContent from './BarcodeResultContent';
import { useSelectImage } from '~/hooks/useSelectImage';
import { View } from 'react-native';
import { Info } from 'lucide-react-native';
import { X } from 'lucide-react-native';
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert';
import { TouchableOpacity } from 'react-native';

interface BarcodeResultModalProps {
  isVisible: boolean;
  barcode: string | null;
  onClose: () => void;
  onSelectFood?: (food: foodTypes.Food) => void;
}

/**
 * 바코드 스캔 결과 모달 컴포넌트
 */
export default function BarcodeResultModal({
  isVisible,
  barcode,
  onClose,
  onSelectFood
}: BarcodeResultModalProps) {
  // 상태 관리
  const { user, isAuthenticated } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  const [showAlert, setShowAlert] = useState(false);
  const [showUploadFoodImageUI, setShowUploadFoodImageUI] = useState(false);
  const [editedBarcode, setEditedBarcode] = useState<string | null>(null); // 수정된 바코드 상태
  
  // 바코드 식품 정보 훅 사용
  const { food, error, isLoading, barcodeFoodInfo, barcodeFoodInfoError } = 
    useBarcodeFood(barcode, isVisible);
  
  // 식품 이미지 업로드 관련
  const { mutate: mutateUploadFoodImage, isLoading: isUploadFoodImageLoading } = useUploadFoodProductPhotoMutation();
  
  const uploadFoodImage = (base64: string, foodImageType: foodTypes.FoodProductPhotoType) => {
    const currentBarcode = editedBarcode || barcode; // 수정된 바코드가 있으면 사용, 없으면 원래 바코드
    if (currentBarcode && isAuthenticated && base64) {
      mutateUploadFoodImage({
        userId: user?.id ?? "",
        barcode: currentBarcode,
        photoType: foodImageType,
        base64: base64
      },{
        onSuccess: () => {
          refetchFoodProductPhotos();
        },
        onError: (error) => {
          console.log('식품 이미지 업로드 실패:', (error as any)?.message || String(error) || 'Unknown error');
        }
      })
    }
  }
  
  const { pickImage: pickImageFront, takePhoto: takePhotoFront } = useSelectImage(
    (base64: string) => {
      uploadFoodImage(base64, "front");
    }
  );
  
  const { pickImage: pickImageBack, takePhoto: takePhotoBack } = useSelectImage(
    (base64: string) => {
      uploadFoodImage(base64, "back");
    }
  );
  
  const { pickImage: pickImageNutrition, takePhoto: takePhotoNutrition } = useSelectImage(
    (base64: string) => {
      uploadFoodImage(base64, "nutrition");
    }
  );

  const { pickImage: pickImageOther, takePhoto: takePhotoOther } = useSelectImage(
    (base64: string) => {
      uploadFoodImage(base64, "other");
    }
  );

  const {
    data: foodProductPhotos,
    isLoading: isFoodProductPhotosLoading,
    error: foodProductPhotosError,
    refetch: refetchFoodProductPhotos
  } = useGetFoodProductPhotosQuery(user?.id ?? "", editedBarcode || barcode || "");

  // 요청하기 버튼 클릭 핸들러
  const handleRequestFood = () => {
    setShowUploadFoodImageUI(true);
  };
  
  // 음식 선택 핸들러
  const handleSelectFood = () => {
    if (food && onSelectFood) {
      onSelectFood(food);
    }
    onClose();
  };
  
  // 알림 닫기 핸들러
  const handleCloseAlert = () => {
    console.log('식품 추가 요청 알림 닫기');
    setShowAlert(false);
  };

  // 조건부 렌더링 결정
  const renderModalContent = () => {
    // 에러가 있는 경우
    if ((error || barcodeFoodInfoError) && isVisible) {
      if (showUploadFoodImageUI) {
        return (
          <BarcodeUploadContent
            barcode={editedBarcode || barcode} // 수정된 바코드가 있으면 사용, 없으면 원래 바코드 사용
            onClose={() => {
              setShowUploadFoodImageUI(false);
              onClose();
            }}
            foodProductPhotos={foodProductPhotos}
            uploadFoodImage={uploadFoodImage}
            isDarkColorScheme={isDarkColorScheme}
          />
        );
      }
      
      return (
        <BarcodeErrorContent
          barcode={barcode}
          onClose={onClose}
          onRequestFood={handleRequestFood}
          onBarcodeChange={setEditedBarcode} // 수정된 바코드를 상태에 저장
          // isDarkColorScheme={isDarkColorScheme}
        />
      );
    }
    
    // 로딩 중인 경우
    if (isLoading && !error && !barcodeFoodInfoError && isVisible) {
      return (
        <BarcodeLoadingContent
          barcode={barcode}
          onClose={onClose}
          isDarkColorScheme={isDarkColorScheme}
        />
      );
    }
    
    // 결과가 있는 경우
    if (food && isVisible) {
      return (
        <BarcodeResultContent
          barcode={barcode}
          food={food}
          onClose={onClose}
          onSelectFood={handleSelectFood}
          isDarkColorScheme={isDarkColorScheme}
        />
      );
    }
    
    // 기본 상태 (모달이 표시되어야 하지만 다른 상태가 없는 경우)
    if (isVisible) {
      return (
        <BarcodeLoadingContent
          barcode={barcode}
          onClose={onClose}
          isEmpty={true}
          isDarkColorScheme={isDarkColorScheme}
        />
      );
    }
    
    return null;
  };

  // 알림 렌더링
  const renderAlert = () => {
    if (!isVisible && showAlert) {
      return (
        <TouchableWithoutFeedback onPress={handleCloseAlert}>
          <View className="absolute inset-0 z-40 flex justify-start">
            <View className="absolute inset-x-4 top-4 z-50">
              <TouchableWithoutFeedback>
                <View>
                  <Alert 
                    icon={Info} 
                    iconSize={22} 
                    variant="default"
                    className="border-primary/20 bg-primary/10"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <AlertTitle className="text-primary">식품 추가 요청</AlertTitle>
                        <AlertDescription className="text-primary/80">
                          {barcode && `바코드 ${barcode}에 해당하는 `}제품 등록 요청이 접수되었습니다. 곧 처리될 예정입니다.
                        </AlertDescription>
                      </View>
                      <TouchableOpacity 
                        onPress={handleCloseAlert}
                        className="rounded-full bg-primary/10 p-1"
                      >
                        <X size={16} color={isDarkColorScheme 
                          ? "hsl(221.2, 83.2%, 65%)" 
                          : "hsl(221.2, 83.2%, 53.3%)"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </Alert>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      );
    }
    
    return null;
  };

  return (
    <>
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        {renderModalContent()}
      </Modal>
      
      {renderAlert()}
    </>
  );
} 