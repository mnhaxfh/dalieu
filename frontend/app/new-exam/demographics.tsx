import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { ArrowLeft } from 'lucide-react-native';

export default function DemographicsScreen() {
  const router = useRouter();
  const demographics = useExamStore(state => state.demographics);
  const updateDemographics = useExamStore(state => state.updateDemographics);
  const sessionId = useExamStore(state => state.sessionId);

  const handleNext = () => {
    if (!demographics.age || !demographics.sex || !demographics.chiefComplaint) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (Tuổi, Giới tính, Địa chỉ chi tiết).");
      return;
    }
    router.push('/new-exam/privacy');
  };

  const sexOptions: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#2A3B4C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>1. Hành chính (Lễ tân)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <View style={styles.section}>
            <Text style={styles.label}>Họ và Tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nguyễn Văn A"
              value={demographics.knownConditions || ''} // Tái sử dụng để lưu tên khớp với DB hoặc lưu riêng
              onChangeText={text => updateDemographics({ knownConditions: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Tuổi *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="numeric"
                value={demographics.age > 0 ? demographics.age.toString() : ''}
                onChangeText={text => updateDemographics({ age: parseInt(text) || 0 })}
              />
            </View>

            <View style={[styles.section, { flex: 1 }]}>
              <Text style={styles.label}>Giới tính *</Text>
              <View style={styles.sexContainer}>
                {sexOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sexButton,
                      demographics.sex === option && styles.sexButtonActive
                    ]}
                    onPress={() => updateDemographics({ sex: option })}
                  >
                    <Text style={[
                      styles.sexButtonText,
                      demographics.sex === option && styles.sexButtonTextActive
                    ]}>
                      {option === 'Male' ? 'Nam' : option === 'Female' ? 'Nữ' : 'Khác'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="0901 234 567"
              keyboardType="phone-pad"
              value={demographics.bodySite || ''} // Re-use bodysite for phone or map it
              onChangeText={text => updateDemographics({ bodySite: text })}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Địa chỉ chi tiết *</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="123 Đường X, TP Vĩnh Long, Tỉnh Vĩnh Long"
              multiline
              textAlignVertical="top"
              value={demographics.chiefComplaint}
              onChangeText={text => updateDemographics({ chiefComplaint: text })}
            />
          </View>

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Mã AI sinh tự động:</Text>
            <Text style={styles.idValue}>PT-{sessionId.substring(0, 6).toUpperCase()}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Lưu và Chuyển ca khám</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: '#138E66',
    borderBottomWidth: 3,
    borderBottomColor: '#2A3B4C'
  },
  backBtn: { padding: 5, marginRight: 10, backgroundColor: '#fff', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: 'Roboto' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#2A3B4C',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#2A3B4C' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2A3B4C'
  },
  sexContainer: { flexDirection: 'row', gap: 6 },
  sexButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  sexButtonActive: { backgroundColor: '#138E66', borderColor: '#2A3B4C' },
  sexButtonText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  idBox: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20
  },
  idLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  idValue: { fontSize: 18, fontWeight: 'bold', color: '#138E66' },
  primaryBtn: {
    backgroundColor: '#138E66',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#138E66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
