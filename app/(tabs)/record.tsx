import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecordScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>기록</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>타임라인</Text>
          <View style={styles.timelinePlaceholder}>
            <Ionicons name="time-outline" size={48} color="#8E8E93" />
            <Text style={styles.timelinePlaceholderText}>타임라인이 여기에 표시됩니다</Text>
          </View>
        </View>

        {/* Discovered Diseases Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>발견된 질병</Text>
          <View style={styles.diseasesCard}>
            <View style={styles.diseaseTags}>
              <View style={styles.diseaseTag}>
                <Text style={styles.diseaseTagText}>#거북목</Text>
              </View>
              <View style={styles.diseaseTag}>
                <Text style={styles.diseaseTagText}>#허리 뒤틀림</Text>
              </View>
              <View style={styles.diseaseTag}>
                <Text style={styles.diseaseTagText}>#골반후반경사</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Analysis Button */}
        <TouchableOpacity style={styles.analysisButton}>
          <Text style={styles.analysisButtonText}>상세분석</Text>
        </TouchableOpacity>

        {/* Spacer for bottom space */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  timelinePlaceholder: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  timelinePlaceholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  diseasesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  diseaseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diseaseTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  diseaseTagText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  analysisButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  bottomSpacer: {
    height: 100,
  },
}); 