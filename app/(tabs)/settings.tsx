import { useSettings } from '@/contexts/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { settings, toggleHaptics, toggleSound, toggleNotifications, isLoadingSettings } = useSettings();

  // 설정 로딩 중에는 아무것도 렌더링하지 않거나 로딩 인디케이터를 표시
  if (isLoadingSettings) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>설정 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <View style={styles.appIcon}>
              <Text style={styles.appIconText}>H</Text>
            </View>
            <View style={styles.appDetails}>
              <Text style={styles.appName}>바로핏</Text>
              <Text style={styles.appVersion}>버전 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일반</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {
            // 이 버튼 자체에 특별한 기능은 없지만, 클릭 피드백을 위해 추가
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>푸시 알림</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => {
                toggleNotifications();
                if (settings.hapticsEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {
            // 이 버튼 자체에 특별한 기능은 없지만, 클릭 피드백을 위해 추가
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>소리 피드백</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => {
                toggleSound();
                if (settings.hapticsEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {
            // 이 버튼 자체에 특별한 기능은 없지만, 클릭 피드백을 위해 추가
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}>
            <View style={styles.settingLeft}>
              <Ionicons name="hardware-chip-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>진동 피드백</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => {
                toggleHaptics();
                if (settings.hapticsEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          {/* 자동 저장은 Context에 없으므로 기존 상태 사용 */}
          <TouchableOpacity style={styles.settingItem} onPress={() => {
            // 이 버튼 자체에 특별한 기능은 없지만, 클릭 피드백을 위해 추가
            if (settings.hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}>
            <View style={styles.settingLeft}>
              <Ionicons name="save-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>자동 저장</Text>
            </View>
            <Switch
              value={true} // 임시로 true
              onValueChange={() => {}} // 임시로 빈 함수
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Camera Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카메라</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="camera-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>카메라 해상도</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>1080p</Text>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="flash-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>플래시</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>자동</Text>
              <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>데이터 및 개인정보</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>개인정보 처리방침</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>이용약관</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, { color: '#FF3B30' }]}>데이터 삭제</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지원</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>도움말</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>문의하기</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="star-outline" size={20} color="#007AFF" />
              <Text style={styles.settingText}>앱 평가하기</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    marginLeft: 4,
  },
  appInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#8E8E93',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
}); 