import { View, Text, StyleSheet, Button, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';

export default function DemographicsScreen() {
  const router = useRouter();
  const demographics = useExamStore(state => state.demographics);
  const updateDemographics = useExamStore(state => state.updateDemographics);

  const handleNext = () => {
    if (!demographics.age || !demographics.sex || !demographics.chiefComplaint) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (Tuổi, Giới tính, Lý do khám).");
      return;
    }
    router.push('/new-exam/review');
  };

  const sexOptions: ('Male' | 'Female' | 'Other')[] = ['Male', 'Female', 'Other'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Step 5: Patient Demographics</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Tuổi bệnh nhân <Text style={{color: 'red'}}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 25"
          keyboardType="numeric"
          value={demographics.age > 0 ? demographics.age.toString() : ''}
          onChangeText={text => updateDemographics({ age: parseInt(text) || 0 })}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Giới tính <Text style={{color: 'red'}}>*</Text></Text>
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
              ]}>{option === 'Male' ? 'Nam' : option === 'Female' ? 'Nữ' : 'Khác'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Vị trí tổn thương (body site)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Cánh tay, Lưng, Mặt..."
          value={demographics.bodySite}
          onChangeText={text => updateDemographics({ bodySite: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Lý do đến khám <Text style={{color: 'red'}}>*</Text></Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Mô tả triệu chứng (ví dụ: Nốt ruồi ngứa, mẩn đỏ...)"
          multiline
          textAlignVertical="top"
          value={demographics.chiefComplaint}
          onChangeText={text => updateDemographics({ chiefComplaint: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bệnh lý kèm theo / Ghi chú</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Tiểu đường, cao huyết áp... (Nếu có)"
          multiline
          textAlignVertical="top"
          value={demographics.knownConditions}
          onChangeText={text => updateDemographics({ knownConditions: text })}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="Continue to Review" onPress={handleNext} color="#3A7CA5" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', color: '#333' },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9', fontSize: 16 },
  sexContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  sexButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#f9f9f9' },
  sexButtonActive: { backgroundColor: '#3A7CA5', borderColor: '#3A7CA5' },
  sexButtonText: { fontSize: 14, color: '#555', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff' }
});
