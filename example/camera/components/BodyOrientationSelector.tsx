import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BodyOrientation } from '~/hooks/useBodyOrientation';

interface BodyOrientationSelectorProps {
  orientation: BodyOrientation;
  onOrientationChange: (orientation: BodyOrientation) => void;
}

export function BodyOrientationSelector({ 
  orientation, 
  onOrientationChange 
}: BodyOrientationSelectorProps) {
  const orientations: { value: BodyOrientation; label: string }[] = [
    { value: 'front', label: '정면' },
    { value: 'back', label: '후면' },
    { value: 'left', label: '좌측면' },
    { value: 'right', label: '우측면' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>신체 방향 선택</Text>
      <View style={styles.buttonContainer}>
        {orientations.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.button,
              orientation === value && styles.activeButton
            ]}
            onPress={() => onOrientationChange(value)}
          >
            <Text style={[
              styles.buttonText,
              orientation === value && styles.activeButtonText
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderColor: 'rgba(59, 130, 246, 1)',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeButtonText: {
    fontWeight: 'bold',
  },
}); 