import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { CONDITION_GROUPS } from '../../src/config/medicalConditions';
import { useExamStore } from '../../src/store/examStore';

const getConditionTag = (groupTitle: string, option: string) => `${groupTitle}: ${option}`;

export default function DemographicsScreen() {
  const router = useRouter();
  const storeDemographics = useExamStore(state => state.demographics);
  const updateStore = useExamStore(state => state.updateDemographics);
  const sessionId = useExamStore(state => state.sessionId);

  // Sử dụng Local State để gõ tiếng Việt không bị giật/mất chữ
  const [age, setAge] = useState(storeDemographics.age > 0 ? storeDemographics.age.toString() : '');
  const [sex, setSex] = useState(storeDemographics.sex);
  const [bodySite, setBodySite] = useState(storeDemographics.bodySite || '');
  const [chiefComplaint, setChiefComplaint] = useState(storeDemographics.chiefComplaint || '');
  const [conditionTags, setConditionTags] = useState<string[]>(storeDemographics.conditionTags || []);
  const [conditionNote, setConditionNote] = useState(storeDemographics.conditionNote || '');

  const toggleCondition = (tag: string) => {
    setConditionTags(currentTags => (
      currentTags.includes(tag)
        ? currentTags.filter(item => item !== tag)
        : [...currentTags, tag]
    ));
  };

  const handleNext = () => {
    const normalizedKnownConditions = [
      ...conditionTags,
      conditionNote.trim() ? `Khác: ${conditionNote.trim()}` : '',
    ].filter(Boolean).join('; ');

    // Đồng bộ toàn bộ dữ liệu vào Store trước khi chuyển màn
    updateStore({
      age: parseInt(age) || 0,
      sex,
      bodySite,
      chiefComplaint,
      conditionTags,
      conditionNote,
      knownConditions: normalizedKnownConditions,
    });

    if (!age || !sex || !chiefComplaint) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (Tuổi, Giới tính, Triệu chứng).");
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
        <Text style={styles.headerTitle}>1. Thông tin hành chính</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Tuổi *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={[styles.section, { flex: 1.5 }]}>
              <Text style={styles.label}>Giới tính *</Text>
              <View style={styles.sexContainer}>
                {sexOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.sexButton,
                      sex === option && styles.sexButtonActive
                    ]}
                    onPress={() => setSex(option)}
                  >
                    <Text style={[
                      styles.sexButtonText,
                      sex === option && styles.sexButtonTextActive
                    ]}>
                      {option === 'Male' ? 'Nam' : option === 'Female' ? 'Nữ' : 'Khác'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Vị trí tổn thương</Text>
            <TextInput
              style={styles.input}
              placeholder="Cánh tay, lưng, mặt..."
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
              importantForAutofill="no"
              value={bodySite}
              onChangeText={setBodySite}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Triệu chứng / Lý do khám *</Text>
            <TextInput

              style={[styles.input, { height: 100 }]}
              placeholder="Nhập triệu chứng cụ thể..."

              multiline
              textAlignVertical="top"
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
              importantForAutofill="no"
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tình trạng bệnh lý đã biết</Text>
            <View style={styles.conditionsBox}>
              {CONDITION_GROUPS.map(group => (
                <View key={group.key} style={styles.conditionGroup}>
                  <Text style={styles.conditionGroupTitle}>{group.title}</Text>
                  <View style={styles.conditionOptions}>
                    {group.options.map(option => {
                      const tag = getConditionTag(group.title, option);
                      const isSelected = conditionTags.includes(tag);

                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.conditionChip, isSelected && styles.conditionChipActive]}
                          onPress={() => toggleCondition(tag)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.conditionChipText, isSelected && styles.conditionChipTextActive]}>
                            {isSelected ? '✓ ' : ''}{option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.conditionNoteSection}>
                <Text style={styles.conditionGroupTitle}>Khác (ghi chú)</Text>
                <TextInput
                  style={[styles.input, styles.conditionNoteInput]}
                  placeholder="Nhập tình trạng khác nếu có..."
                  multiline
                  textAlignVertical="top"
                  autoCorrect={false}
                  spellCheck={false}
                  autoCapitalize="none"
                  importantForAutofill="no"
                  value={conditionNote}
                  onChangeText={setConditionNote}
                />
              </View>
            </View>
          </View>

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>Mã ca khám tự động:</Text>
            <Text style={styles.idValue}>PT-{sessionId.substring(0, 6).toUpperCase()}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>Lưu và Tiếp tục</Text>
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
    backgroundColor: '#3a7ca5',
  },
  backBtn: { padding: 5, marginRight: 10, backgroundColor: '#fff', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    elevation: 3
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
  sexButtonActive: { backgroundColor: '#3a7ca5', borderColor: '#3a7ca5' },
  sexButtonText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  conditionsBox: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conditionGroup: { marginBottom: 14 },
  conditionGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A3B4C',
    marginBottom: 8,
  },
  conditionOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    minHeight: 40,
    justifyContent: 'center',
  },
  conditionChipActive: {
    backgroundColor: '#3a7ca5',
    borderColor: '#3a7ca5',
  },
  conditionChipText: {
    color: '#2A3B4C',
    fontSize: 13,
    fontWeight: '600',
  },
  conditionChipTextActive: { color: '#fff' },
  conditionNoteSection: { marginTop: 2 },
  conditionNoteInput: {
    minHeight: 76,
    backgroundColor: '#fff',
  },
  idBox: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 20
  },
  idLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  idValue: { fontSize: 18, fontWeight: 'bold', color: '#3a7ca5' },
  primaryBtn: {
    backgroundColor: '#3a7ca5',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
