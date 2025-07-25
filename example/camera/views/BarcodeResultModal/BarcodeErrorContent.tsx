/**
 * app/camera/views/BarcodeResultModal/BarcodeErrorContent.tsx
 * 
 * 바코드 스캔 결과 에러 화면
 */
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ShoppingBag, Barcode } from 'lucide-react-native';
import { H4, Muted } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import LottieView from 'lottie-react-native';
import { EAN13Display, EAN8Display, detectBarcodeType } from '~/components/barcode';
import { useColorScheme } from '~/lib/useColorScheme';

interface BarcodeErrorContentProps {
  barcode: string | null;
  onClose: () => void;
  onRequestFood: () => void;
  onBarcodeChange?: (newBarcode: string) => void; // 수정된 바코드를 상위로 전달
  modalWidth?: number; // 모달 너비 (선택적)
}

export default function BarcodeErrorContent({
  barcode,
  onClose,
  onRequestFood,
  onBarcodeChange,
  modalWidth
}: BarcodeErrorContentProps) {
  const animationRef = useRef<LottieView>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableBarcode, setEditableBarcode] = useState(barcode || "");
  const [currentBarcodeInput, setCurrentBarcodeInput] = useState(barcode || "");
  const { isDarkColorScheme } = useColorScheme();
  
  // 바코드 타입 감지
  const barcodeType = detectBarcodeType(editableBarcode);
  const expectedLength = barcodeType === 'EAN-8' ? 8 : 13;
  
  // 바코드 유효성 검사 (실시간 입력 기준)
  const isValidBarcode = currentBarcodeInput.length === expectedLength && new RegExp(`^\\d{${expectedLength}}$`).test(currentBarcodeInput);

  // 바코드 수정 모드 진입
  const handleEditBarcode = () => {
    setIsEditMode(true);
  };

  // 바코드 저장 (EAN13Display에서 호출)
  const handleSaveBarcode = (newBarcode: string) => {
    setEditableBarcode(newBarcode);
    setIsEditMode(false);
    // 수정된 바코드를 상위 컴포넌트로 전달
    onBarcodeChange?.(newBarcode);
  };

  // 수정 모드 취소 (이전 상태로 복원)
  const handleCancelEdit = () => {
    setIsEditMode(false);
    // 원래 바코드로 복원
    setEditableBarcode(barcode || "");
    setCurrentBarcodeInput(barcode || "");
  };

  // 최종 제품 등록
  const handleFinalSubmit = () => {
    // 수정된 바코드로 제품 등록 진행
    onRequestFood();
  };
  
  return (
    <View className="flex-1 items-center justify-center bg-black/60">
      <Card 
        className="rounded-2xl px-4 py-6"
        style={{ 
          width: modalWidth ? modalWidth * 0.9 : '90%', // 모달 너비의 90% 또는 기본 90%
          maxWidth: modalWidth ? modalWidth - 32 : 400, // 최대 너비 제한
        }}
      >
        {/* 애니메이션 효과 */}
        <View style={styles.lottieContainer}>
          <LottieView
            ref={animationRef}
            source={require('~/assets/lottie/congrats1.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <View className="mb-4 items-center">
          <ShoppingBag 
            size={32} 
            color={isDarkColorScheme 
              ? "hsl(217.2, 91.2%, 65%)" // 다크모드 primary
              : "hsl(221.2, 83.2%, 53.3%)" // 라이트모드 primary
            } 
          />
        </View>
        
        <H4 className="mb-2 text-center">
          ✨ 야생의 제품이 나타났다! ✨
        </H4>
        
        <View className="mb-2">
          <Muted className="text-center">
            아직 도감에 등록되지 않은 희귀한 제품을 발견했습니다!
          </Muted>
          <Muted className="text-center">
            이 제품을 처음 발견한 사람은 바로 당신!
          </Muted>
        </View>

        {/* 바코드 표시/편집 영역 - 실제 스캔된 바코드 값 표시 */}
        <View className="mb-2 items-center rounded-lg border border-border bg-background p-0.5">
          {barcodeType === 'EAN-8' ? (
            <EAN8Display 
              barcode={editableBarcode}
              onSave={handleSaveBarcode}
              onEditStart={handleEditBarcode}
              onInputChange={setCurrentBarcodeInput}
              editable={true}
              editing={isEditMode}
              size="md"
            />
          ) : (
            <EAN13Display 
              barcode={editableBarcode}
              onSave={handleSaveBarcode}
              onEditStart={handleEditBarcode}
              onInputChange={setCurrentBarcodeInput}
              editable={true}
              editing={isEditMode}
              size="md"
            />
          )}
          {!isEditMode && (
            <Muted className="mb-2 text-center text-xs text-muted-foreground">
              탭하여 수정
            </Muted>
          )}
        </View>

        {!isEditMode && (
          <Muted className="mb-6 text-center text-xs text-primary/80">
            지금바로 증거를 제출하세요!
          </Muted>
        )}
        
        <View className="flex-row justify-center gap-3">
          <Button 
            variant="outline"
            onPress={isEditMode ? handleCancelEdit : onClose}
            style={{ flex: 1 }}
          >
            <Text className="font-medium">{isEditMode ? "이전" : "닫기"}</Text>
          </Button>
          
          {!isEditMode ? (
            <Button 
              variant="default"
              onPress={handleFinalSubmit}
              style={{ flex: 2 }}
            >
              <Text className="font-medium">📸 증거 제출하기</Text>
            </Button>
          ) : (
            <Button 
              variant="default"
              onPress={() => setIsEditMode(false)}
              style={{ flex: 2 }}
              disabled={!isValidBarcode}
            >
              <Text className="font-medium">저장</Text>
            </Button>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  },
  lottie: {
    width: 300,
    height: 300,
  }
}); 