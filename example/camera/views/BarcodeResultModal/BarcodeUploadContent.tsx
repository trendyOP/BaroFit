/**
 * app/camera/views/BarcodeResultModal/BarcodeUploadContent.tsx
 * 
 * 바코드 스캔 결과 이미지 업로드 화면 (새로운 버전)
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image, TouchableWithoutFeedback } from 'react-native';
import { 
  Barcode, 
  X, 
  Camera, 
  ImageIcon, 
  CheckCircle2, 
  Upload,
  Sparkles
} from 'lucide-react-native';
import { EAN13Display, EAN8Display, detectBarcodeType } from '~/components/barcode';
import { H3, H4, P, Muted } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { useSelectImage } from '~/hooks/useSelectImage';
import ImageView from 'react-native-image-viewing';
import LottieView from 'lottie-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PhotoItem {
  type: 'front' | 'back' | 'nutrition' | 'other';
  name: string;
  description: string;
  images: string[];
  isRequired: boolean;
  icon: any;
}

interface BarcodeUploadContentProps {
  barcode: string | null;
  onClose: () => void;
  foodProductPhotos?: {
    front?: string | null;
    back?: string | null;
    nutrition?: string | null;
    other?: string | null;
  };
  uploadFoodImage: (base64: string, photoType: 'front' | 'back' | 'nutrition' | 'other') => void;
  isDarkColorScheme: boolean;
}



export default function BarcodeUploadContent({
  barcode,
  onClose,
  foodProductPhotos,
  uploadFoodImage,
  isDarkColorScheme
}: BarcodeUploadContentProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([
    {
      type: 'front',
      name: '제품 앞면',
      description: '제품명과 브랜드',
      images: [], // 항상 빈 배열로 시작
      isRequired: true,
      icon: Camera
    },
    {
      type: 'back',
      name: '제품 뒷면',
      description: '원재료명과 제조사',
      images: [], // 항상 빈 배열로 시작
      isRequired: true,
      icon: ImageIcon
    },
    {
      type: 'nutrition',
      name: '영양성분표',
      description: '칼로리와 영양정보',
      images: [], // 항상 빈 배열로 시작
      isRequired: false,
      icon: Barcode
    },
    {
      type: 'other',
      name: '기타 정보',
      description: '추가 제품 정보',
      images: [], // 항상 빈 배열로 시작
      isRequired: false,
      icon: Upload
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState<string | null>(null);
  
  // ImageView 상태
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 바코드 타입 감지
  const barcodeType = detectBarcodeType(barcode || "");

  const primaryColor = isDarkColorScheme 
    ? "hsl(217.2, 91.2%, 65%)" 
    : "hsl(221.2, 83.2%, 53.3%)";
  
  const mutedColor = isDarkColorScheme
    ? "hsl(215.4, 16.3%, 65%)" 
    : "hsl(215.4, 16.3%, 46.9%)";

  // 진행률 계산
  const completedPhotos = photos.filter(photo => photo.images.length > 0).length;
  const requiredPhotos = photos.filter(photo => photo.isRequired).length;
  const completedRequiredPhotos = photos.filter(photo => photo.isRequired && photo.images.length > 0).length;
  const canSubmit = completedRequiredPhotos >= requiredPhotos;

  // useSelectImage 훅 - 모든 사진을 세로형 비율로 통일
  const getAspectRatioForPhotoType = (type: string): [number, number] => {
    return [3, 4]; // 모든 타입을 세로형 비율로 통일
  };

  const { takePhoto, pickImage } = useSelectImage(
    (base64: string) => {
      handlePhotoAdd(base64);
    },
    {
      aspectRatio: getAspectRatioForPhotoType(selectedPhotoType || 'front'),
      quality: 0.8,
      maxSize: 800, // 제품 사진은 조금 더 큰 크기로
      format: ImageManipulator.SaveFormat.JPEG
    }
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
          try {
        // 각 타입별로 사진들을 API에 업로드
        for (const photo of photos) {
          if (photo.images.length > 0) {
            for (const base64Image of photo.images) {
              // 상위에서 받은 uploadFoodImage 함수 사용
              uploadFoodImage(base64Image, photo.type);
              console.log(`${photo.type} 이미지 업로드 시작 (크기: ${base64Image.length} bytes)`);
            }
          }
        }
      
      const photoData = photos.reduce((acc, photo) => {
        acc[photo.type] = photo.images;
        return acc;
      }, {} as { [key: string]: string[] });
      
      // 사진 개수만 로그로 출력 (base64 데이터는 제외)
      const photoSummary = photos.reduce((acc, photo) => {
        acc[photo.type] = `${photo.images.length}개`;
        return acc;
      }, {} as { [key: string]: string });
      
      console.log('제출된 사진들:', photoSummary);
      
      // 완료 상태로 변경
      setIsCompleted(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('사진 업로드 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 사진 선택 모달 표시
  const handlePhotoCardPress = (type: string) => {
    setSelectedPhotoType(type);
  };

  // 사진 선택 모달 닫기
  const handleClosePhotoModal = () => {
    setSelectedPhotoType(null);
  };

  // 사진 추가 - barcode-upload.tsx와 동일한 방식 (로컬 상태만 업데이트)
  const handlePhotoAdd = (base64: string) => {
    if (selectedPhotoType) {
      setPhotos(prev => prev.map(photo => 
        photo.type === selectedPhotoType 
          ? { ...photo, images: [...photo.images, base64] }
          : photo
      ));
    }
  };

  // 사진 제거
  const handlePhotoRemove = (base64: string) => {
    if (selectedPhotoType) {
      setPhotos(prev => prev.map(photo => 
        photo.type === selectedPhotoType 
          ? { ...photo, images: photo.images.filter(img => img !== base64) }
          : photo
      ));
    }
  };

  // 현재 선택된 사진 타입의 사진 배열
  const getCurrentPhotos = () => {
    if (!selectedPhotoType) return [];
    const photo = photos.find(p => p.type === selectedPhotoType);
    return photo?.images || [];
  };

  // 현재 선택된 사진 타입의 이름
  const getCurrentPhotoName = () => {
    if (!selectedPhotoType) return '';
    const photo = photos.find(p => p.type === selectedPhotoType);
    return photo?.name || '';
  };

  // 사진 클릭 핸들러 - 전체 화면으로 보기
  const handlePhotoPress = (index: number) => {
    setCurrentImageIndex(index);
    setImageViewVisible(true);
  };

  // ImageView용 이미지 배열 생성
  const getImageViewImages = () => {
    return getCurrentPhotos().map(photo => ({
      uri: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`
    }));
  };

  // 바코드는 수정 불가능 (제거)

  // 실제 사진 촬영/선택 함수들 - barcode-upload.tsx와 동일한 방식
  const handleTakePhoto = () => {
    takePhoto();
  };

  const handlePickImage = () => {
    pickImage();
  };

  const insets = useSafeAreaInsets();

    return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* 완료 화면 */}
      {isCompleted ? (
        <View className="flex-1 items-center justify-center p-6">
          <LottieView
            source={require('~/assets/lottie/lottie_complete.json')}
            autoPlay
            style={{ width: 120, height: 120 }}
          />
          <H3 className="mt-4 text-center font-bold">📚 도감 등록 요청 완료!</H3>
          <P className="mt-2 text-center text-muted-foreground">
            새로운 제품이 곧 글로벌 도감에 추가됩니다.
          </P>
        </View>
      ) : (
        <>
          {/* 헤더 */}
          <View className="border-b border-border bg-background px-6 py-4">
            <View className="flex-row items-center justify-between">
              <H4>🎊 새로운 제품 GET!</H4>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={mutedColor} />
              </TouchableOpacity>
            </View>
          </View>
      
      {/* 메인 컨텐츠 */}
      <View className="flex-1 p-6">
        {/* 축하 메시지 */}
        <Card className="mb-4 overflow-hidden">
          <View className="bg-primary/10 p-4">
            <View className="flex-row items-center justify-center">
              <Sparkles size={18} color={primaryColor} />
              <P className="mx-2 font-medium text-foreground">희귀 제품 포획!</P>
              <Sparkles size={18} color={primaryColor} />
            </View>
            <View className="mt-2">
              <Muted className="text-center text-foreground">
                축하합니다! 희귀 제품을 성공적으로 포획했습니다!
              </Muted>
              <Muted className="text-center text-foreground">
                처음으로 다른 사람들에게 이 제품을 알려보세요!
              </Muted>
            </View>
          </View>
        </Card>

        {/* 바코드 영역 - 실제 스캔된 바코드 값 표시 (수정 불가) */}
        <View className="mb-4">
          {barcodeType === 'EAN-8' ? (
            <EAN8Display 
              barcode={barcode || ""}
              editable={false}
              size="md"
              isDarkColorScheme={isDarkColorScheme}
            />
          ) : (
            <EAN13Display 
              barcode={barcode || ""}
              editable={false}
              size="md"
              isDarkColorScheme={isDarkColorScheme}
            />
          )}
        </View>

        {/* 사진 목록 - 2x2 그리드 */}
        <View className="flex-1 gap-3">
          <View className="flex-1 flex-row gap-3">
            {photos.slice(0, 2).map((photo) => (
              <TouchableOpacity
                key={photo.type}
                onPress={() => handlePhotoCardPress(photo.type)}
                className="flex-1"
              >
                <Card className="flex-1 overflow-hidden p-3">
                  {/* 완료 상태 표시 */}
                  {photo.images.length > 0 && (
                    <View className="absolute right-2 top-2 z-10">
                      <CheckCircle2 size={16} color={primaryColor} />
                    </View>
                  )}
                  
                  {/* 문서 미리보기 영역 */}
                  <View className="relative mb-2 flex-1 items-center justify-center rounded-lg bg-secondary/50">
                    {/* 필수 배지 */}
                    {photo.isRequired && (
                      <View className="absolute right-1 top-1 z-10 rounded-full bg-primary/90 px-1.5 py-0.5">
                        <Muted className="text-xs font-medium text-primary-foreground">필수</Muted>
                      </View>
                    )}
                    
                    {/* 예시 이미지 */}
                    {photo.type === 'front' ? (
                      <Image
                        source={require('~/assets/images/product-example-front.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : photo.type === 'back' ? (
                      <Image
                        source={require('~/assets/images/product-example-back.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : photo.type === 'nutrition' ? (
                      <Image
                        source={require('~/assets/images/nutrition-label.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="items-center">
                        <View className="mb-1 h-6 w-4 rounded-sm border-2 border-dashed border-muted-foreground/30" />
                        <Muted className="text-xs">사진 추가</Muted>
                      </View>
                    )}

                    {/* 완료 오버레이 */}
                    {photo.images.length > 0 && (
                      <View className="absolute inset-0 items-center justify-center rounded-lg bg-black/40">
                        <CheckCircle2 size={24} color="white" />
                        <Text className="mt-1 text-xs font-medium text-white">
                          {photo.images.length}개 완료
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* 카드 제목과 설명 */}
                  <View className="items-center">
                    <P className="text-xs font-medium">{photo.name}</P>
                    <Muted className="text-center text-xs">{photo.description}</Muted>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
          
          <View className="flex-1 flex-row gap-3">
            {photos.slice(2, 4).map((photo) => (
              <TouchableOpacity
                key={photo.type}
                onPress={() => handlePhotoCardPress(photo.type)}
                className="flex-1"
              >
                <Card className="flex-1 overflow-hidden p-3">
                  {/* 완료 상태 표시 */}
                  {photo.images.length > 0 && (
                    <View className="absolute right-2 top-2 z-10">
                      <CheckCircle2 size={16} color={primaryColor} />
                    </View>
                  )}
                  
                  {/* 문서 미리보기 영역 */}
                  <View className="relative mb-2 flex-1 items-center justify-center rounded-lg bg-secondary/50">
                    {/* 필수 배지 */}
                    {photo.isRequired && (
                      <View className="absolute right-1 top-1 z-10 rounded-full bg-primary/90 px-1.5 py-0.5">
                        <Muted className="text-xs font-medium text-primary-foreground">필수</Muted>
                      </View>
                    )}
                    
                    {/* 예시 이미지 */}
                    {photo.type === 'front' ? (
                      <Image
                        source={require('~/assets/images/product-example-front.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : photo.type === 'back' ? (
                      <Image
                        source={require('~/assets/images/product-example-back.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : photo.type === 'nutrition' ? (
                      <Image
                        source={require('~/assets/images/nutrition-label.png')}
                        className="h-full w-full rounded-sm"
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="items-center">
                        <View className="mb-1 h-6 w-4 rounded-sm border-2 border-dashed border-muted-foreground/30" />
                        <Muted className="text-xs">사진 추가</Muted>
                      </View>
                    )}

                    {/* 완료 오버레이 */}
                    {photo.images.length > 0 && (
                      <View className="absolute inset-0 items-center justify-center rounded-lg bg-black/40">
                        <CheckCircle2 size={24} color="white" />
                        <Text className="mt-1 text-xs font-medium text-white">
                          {photo.images.length}개 완료
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {/* 카드 제목과 설명 */}
                  <View className="items-center">
                    <P className="text-xs font-medium">{photo.name}</P>
                    <Muted className="text-center text-xs">{photo.description}</Muted>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 하단 고정 버튼 */}
      <View className="border-t border-border bg-background p-6">
        <Button 
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          <View className="flex-row items-center gap-2">
            {isSubmitting ? (
                              <Text className="font-medium text-primary-foreground">증거 제출 중...</Text>
            ) : (
              <Text className="font-medium text-primary-foreground">📸 포획 증거 제출</Text>
            )}
          </View>
        </Button>
      </View>

      {/* 사진 선택 모달 */}
      {selectedPhotoType && (
        <View className="absolute inset-0 z-50 bg-black/50">
          <TouchableWithoutFeedback onPress={handleClosePhotoModal}>
            <View className="flex-1 items-center justify-center p-4">
              <TouchableWithoutFeedback>
                <View className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
              {/* 헤더 */}
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">
                  {getCurrentPhotoName()}
                </Text>
                <TouchableOpacity onPress={handleClosePhotoModal}>
                  <X size={24} color={mutedColor} />
                </TouchableOpacity>
              </View>

              {/* 촬영 안내 메시지 */}
              <View className="mb-6 rounded-lg bg-primary/10 p-3">
                <View className="flex-row items-center">
                  <Camera size={16} color={primaryColor} />
                  <Text className="ml-2 text-sm font-medium text-primary">촬영 가이드</Text>
                </View>
                <Text className="mt-1 text-xs text-primary/80">
                  {selectedPhotoType === 'front' 
                    ? "제품명과 브랜드가 잘 보이도록 정면에서 촬영해주세요!"
                    : selectedPhotoType === 'back'
                    ? "원재료명과 제조사 정보가 선명하게 보이도록 촬영해주세요!"
                    : selectedPhotoType === 'nutrition'
                    ? "영양성분표 전체가 잘 보이도록 가까이에서 촬영해주세요!"
                    : "추가 제품 정보를 자유롭게 촬영해주세요!"
                  }
                </Text>
              </View>

              {/* 사진 그리드 */}
              {getCurrentPhotos().length > 0 && (
                <View className="mb-6">
                  <Text className="mb-3 text-center text-sm text-muted-foreground">
                    사진 {getCurrentPhotos().length}/4개
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {getCurrentPhotos().map((photo, index) => (
                      <TouchableOpacity 
                        key={index} 
                        className="relative" 
                        style={{ width: '48%' }}
                        onPress={() => handlePhotoPress(index)}
                      >
                        <Image
                          source={{ uri: photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}` }}
                          className="aspect-square rounded-lg"
                          style={{ width: '100%' }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full bg-destructive"
                          onPress={() => handlePhotoRemove(photo)}
                        >
                          <X size={12} color="white" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* 버튼들 */}
              {getCurrentPhotos().length < 4 && (
                <View className="gap-3">
                  <TouchableOpacity
                    className="flex-row items-center justify-center rounded-xl bg-primary py-4"
                    onPress={handleTakePhoto}
                  >
                    <Camera size={20} color="white" />
                    <Text className="ml-2 font-medium text-primary-foreground">카메라로 촬영</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center justify-center rounded-xl bg-secondary py-4"
                    onPress={handlePickImage}
                  >
                    <ImageIcon size={20} color={mutedColor} />
                    <Text className="ml-2 font-medium text-secondary-foreground">갤러리에서 선택</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 최대 개수 도달 시 메시지 */}
              {getCurrentPhotos().length >= 4 && (
                <Text className="text-center text-sm text-muted-foreground">
                  최대 4개까지 사진을 첨부할 수 있어요.
                </Text>
              )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </View>
      )}

      {/* 이미지 전체 화면 뷰어 */}
      <ImageView
        images={getImageViewImages()}
        imageIndex={currentImageIndex}
        visible={imageViewVisible}
        onRequestClose={() => setImageViewVisible(false)}
      />
        </>
      )}
    </View>
  );
} 