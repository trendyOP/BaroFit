/**
 * app/camera/views/BarcodeResultModal/BarcodeLoadingContent.tsx
 * 
 * 바코드 스캔 결과 로딩 화면
 */
import React from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Barcode } from 'lucide-react-native';
import { H4, P, Muted } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';

interface BarcodeLoadingContentProps {
  barcode: string | null;
  onClose: () => void;
  isEmpty?: boolean;
  isDarkColorScheme: boolean;
}

export default function BarcodeLoadingContent({
  barcode,
  onClose,
  isEmpty = false,
  isDarkColorScheme
}: BarcodeLoadingContentProps) {
  return (
    <View className="flex-1 items-center justify-center bg-black/60">
      <Card className="w-11/12 max-w-sm items-center rounded-2xl p-6">
        <Barcode 
          size={32} 
          color={isDarkColorScheme 
            ? "hsl(217.2, 91.2%, 65%)" // 다크모드 primary
            : "hsl(221.2, 83.2%, 53.3%)" // 라이트모드 primary
          } 
          className="mb-4" 
        />
        
        <H4 className="mb-4 text-center">
          {isEmpty ? '바코드를 스캔해주세요' : '바코드 검색 중...'}
        </H4>
        
        {!isEmpty && (
          <>
            <ActivityIndicator 
              size="large" 
              color={isDarkColorScheme 
                ? "hsl(217.2, 91.2%, 65%)" // 다크모드 primary 
                : "hsl(221.2, 83.2%, 53.3%)" // 라이트모드 primary
              } 
            />
            <Muted className="mt-4 text-center">
              {barcode}
            </Muted>
          </>
        )}
        
        <Button 
          variant={isEmpty ? "outline" : "ghost"}
          onPress={onClose}
          className="mt-6"
        >
          <P className="text-muted-foreground">
            {isEmpty ? '닫기' : '검색 취소'}
          </P>
        </Button>
      </Card>
    </View>
  );
} 