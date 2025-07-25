/**
 * app/camera/views/BarcodeResultModal/BarcodeResultContent.tsx
 * 
 * 바코드 스캔 결과 정보 화면
 */
import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Barcode, X } from 'lucide-react-native';
import { H4, P, Muted } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { foodTypes } from 'fitlyever-ts-rest-contract';
import { foodIconMap } from '~/lib/iconMap';

interface BarcodeResultContentProps {
  barcode: string | null;
  food: foodTypes.Food;
  onClose: () => void;
  onSelectFood: () => void;
  isDarkColorScheme: boolean;
}

export default function BarcodeResultContent({
  barcode,
  food,
  onClose,
  onSelectFood,
  isDarkColorScheme
}: BarcodeResultContentProps) {
  const mutedColor = isDarkColorScheme
    ? "hsl(215.4, 16.3%, 65%)" // 다크모드 muted-foreground
    : "hsl(215.4, 16.3%, 46.9%)"; // 라이트모드 muted-foreground
  
  return (
    <View className="flex-1 items-center justify-center bg-black/60">
      <Card className="w-11/12 max-w-sm rounded-2xl p-6">
        {/* 헤더와 닫기 버튼 */}
        <View className="mb-4 flex-row items-center justify-between">
          <H4>바코드 스캔 결과</H4>
          <TouchableOpacity
            onPress={onClose}
            className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X size={20} color={mutedColor} />
          </TouchableOpacity>
        </View>
        
        {/* 바코드 정보 */}
        <View className="mb-4 flex-row items-center rounded-lg bg-secondary p-2">
          <Barcode size={20} color={mutedColor} />
          <Muted className="ml-2 flex-1">
            {barcode}
          </Muted>
        </View>
        
        {/* 음식 정보 */}
        <View className="mb-6">
          {/* 음식 아이콘과 이름 */}
          <View className="mb-3 flex-row items-center">
            <View className="mr-3 h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Image
                source={foodIconMap[food.emoji as keyof typeof foodIconMap ?? 'dish']}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </View>
            <View className="flex-1">
              <P className="mb-1 text-base font-bold">
                {food.food_name}
              </P>
              <Muted>
                {food.food_type === 'Brand' && food.brand_name 
                  ? food.brand_name 
                  : food.food_sub_categories?.food_sub_category?.join(', ') || '기타'
                }
              </Muted>
            </View>
          </View>
          
          {/* 영양 정보 요약 */}
          <Card className="bg-secondary p-3">
            <P className="mb-2 text-sm font-medium">영양 정보</P>
            <View className="flex-row justify-between">
              <View className="items-center">
                <P className="text-base font-bold">{food.calories}</P>
                <Muted className="text-xs">칼로리(kcal)</Muted>
              </View>
              <View className="items-center">
                <P className="text-base font-bold">{food.carbohydrate}g</P>
                <Muted className="text-xs">탄수화물</Muted>
              </View>
              <View className="items-center">
                <P className="text-base font-bold">{food.protein}g</P>
                <Muted className="text-xs">단백질</Muted>
              </View>
              <View className="items-center">
                <P className="text-base font-bold">{food.fat}g</P>
                <Muted className="text-xs">지방</Muted>
              </View>
            </View>
          </Card>
        </View>
        
        {/* 버튼 영역 */}
        <View className="flex-row justify-between">
          <Button 
            variant="outline"
            className="mr-2 flex-1"
            onPress={onClose}
          >
            <P>취소</P>
          </Button>
          <Button 
            className="flex-1 bg-primary"
            onPress={onSelectFood}
            disabled={!food}
          >
            <P className="font-medium text-primary-foreground">음식 선택</P>
          </Button>
        </View>
      </Card>
    </View>
  );
} 