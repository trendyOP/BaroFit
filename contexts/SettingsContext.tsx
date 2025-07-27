import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface Settings { 
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  toggleHaptics: () => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
  isLoadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = '@BaroFit:settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    hapticsEnabled: true,
    soundEnabled: true,
    notificationsEnabled: true,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 설정 로드
  useEffect(() => {
    async function loadSettings() {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error('설정 로딩 실패:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  // 설정 저장
  useEffect(() => {
    if (!isLoadingSettings) { // 초기 로딩 후 변경 시에만 저장
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(error => {
        console.error('설정 저장 실패:', error);
      });
    }
  }, [settings, isLoadingSettings]);

  const toggleHaptics = useCallback(() => {
    setSettings(prev => ({ ...prev, hapticsEnabled: !prev.hapticsEnabled }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleNotifications = useCallback(() => {
    setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
  }, []);

  const contextValue = useMemo(() => ({
    settings,
    toggleHaptics,
    toggleSound,
    toggleNotifications,
    isLoadingSettings,
  }), [settings, toggleHaptics, toggleSound, toggleNotifications, isLoadingSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 