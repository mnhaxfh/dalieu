import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Switch, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

export default function ReviewScreen() {
  const router = useRouter();
  const store = useExamStore();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!store.finalImageUri) {
      Alert.alert("Lỗi", "Không tìm thấy ảnh đã xử lý để gửi.");
      return;
    }

    if (!token) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để thực hiện nộp ca khám.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Sử dụng service api tập trung để đảm bảo đồng bộ logic (xử lý Blob/FormData)
      const responseData = await api.examinations.create(
        {
          age: store.demographics.age,
          sex: store.demographics.sex || 'Other',
          chief_complaint: store.demographics.chiefComplaint || 'Không rõ',
          known_conditions: store.demographics.knownConditions,
          photoUri: store.finalImageUri,
          photoName: store.finalImageName,
          photoType: store.finalImageType,
        },
        token
      );
      
      Alert.alert(
        "Thành công!", 
        `Ca khám đã được nộp thành công.\nID: ${responseData.patient_id}\nTrạng thái: ${responseData.status}`
      );
      
      // Dọn dẹp session và quay về trang chủ (hoặc tab history)
      store.startNewSession();
      router.dismissAll();
      router.replace('/(tabs)/history');
      
    } catch (error: any) {
      console.error("Lỗi khi nộp ca khám:", error);
      Alert.alert("Lỗi Gửi Dữ Liệu", error.message || "Không thể kết nối tới server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Step 6: Review & Submit</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Patient Demographics:</Text>
        <Text>Age: {store.demographics.age}</Text>
        <Text>Sex: {store.demographics.sex}</Text>
        <Text>Body Site: {store.demographics.bodySite}</Text>
        <Text>Complaint: {store.demographics.chiefComplaint}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Image Processing Summary:</Text>
        <View style={styles.row}>
          <Text>Remove Hair (Backend AI): </Text>
          <Switch 
            value={store.flags.removeHair} 
            onValueChange={store.setRemoveHairFlag} 
          />
        </View>
        <Text>Eyes Blurred: {store.flags.eyesBlurred ? 'Yes' : 'No'}</Text>
        <Text style={{ fontSize: 10, color: '#666', marginTop: 10 }}>
          File: {store.finalImageName}
        </Text>
      </View>

      {isSubmitting ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Đang tải ảnh và xử lý dữ liệu...</Text>
        </View>
      ) : (
        <Button title="Submit Examination" onPress={handleSubmit} color="#28a745" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fcfcfc' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20, padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fff' },
  subtitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  loadingArea: { alignItems: 'center', marginTop: 20 },
  loadingText: { marginTop: 10, color: '#666' }
});
