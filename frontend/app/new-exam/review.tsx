import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { ArrowLeft, CloudLightning, AlertTriangle } from 'lucide-react-native';

export default function ReviewScreen() {
  const router = useRouter();
  const store = useExamStore();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sexLabel = store.demographics.sex === 'Male'
    ? 'Nam'
    : store.demographics.sex === 'Female'
      ? 'Nữ'
      : store.demographics.sex === 'Other'
        ? 'Khác'
        : 'Chưa chọn';
  const conditionSummary = [
    ...(store.demographics.conditionTags || []),
    store.demographics.conditionNote?.trim() ? `Khác: ${store.demographics.conditionNote.trim()}` : '',
  ].filter(Boolean).join('; ') || store.demographics.knownConditions || 'Không có';

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
      // Chuẩn bị dữ liệu bệnh lý (định nghĩa JSON chuỗi cho known_conditions để khớp DB backend)
      const rawNotes = store.demographics.knownConditions || '';
      const formattedConditions = JSON.stringify({
        notes: rawNotes,
        autogen_id: `PT-${store.sessionId.substring(0, 6).toUpperCase()}`
      });

      const responseData = await api.examinations.create(
        {
          age: store.demographics.age,
          sex: store.demographics.sex || 'Other',
          chief_complaint: store.demographics.chiefComplaint || 'Không rõ',
          known_conditions: formattedConditions, // Đã khớp dạng JSON string
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
      
      // Dọn dẹp session và quay về trang chủ
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
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#2A3B4C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>4. Xem lại & Gửi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          
          <Text style={styles.sectionLabel}>ẢNH ĐÃ CROP:</Text>
          {store.finalImageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: store.finalImageUri }} style={styles.imagePreview} resizeMode="cover" />
            </View>
          ) : (
            <View style={[styles.imagePreviewContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
              <Text style={{ color: '#6B7280' }}>Chưa có ảnh được chụp</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>THÔNG TIN HÀNH CHÍNH:</Text>
          <View style={styles.infoSummary}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Tuổi</Text>
              <Text style={styles.infoValue}>{store.demographics.age || 'Chưa điền'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Giới tính</Text>
              <Text style={styles.infoValue}>{sexLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Vị trí tổn thương</Text>
              <Text style={styles.infoValue}>{store.demographics.bodySite || 'Chưa điền'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Triệu chứng / Lý do</Text>
              <Text style={styles.infoValue}>{store.demographics.chiefComplaint || 'Chưa điền'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoKey}>Tình trạng bệnh lý</Text>
              <Text style={styles.infoValue}>{conditionSummary}</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <AlertTriangle size={18} color="#9CA3AF" style={{ marginTop: 1 }} />
            <Text style={styles.warningText}>
              Xác nhận thông tin chính xác trước khi gửi dữ liệu lên hệ thống AI phân tích.
            </Text>
          </View>

          {isSubmitting ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="large" color="#3a7ca5" />
              <Text style={styles.loadingText}>Đang gửi thông tin và ảnh...</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>Xác nhận và Gửi</Text>
              <CloudLightning size={20} color="#fff" />
            </TouchableOpacity>
          )}

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
    borderBottomWidth: 3,
    borderBottomColor: '#2A3B4C'
  },
  backBtn: { padding: 5, marginRight: 10, backgroundColor: '#fff', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', fontFamily: 'Roboto' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A3B4C',
    marginBottom: 12,
    fontFamily: 'Roboto',
    letterSpacing: 0.5
  },
  imagePreviewContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  infoSummary: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 59, 76, 0.05)'
  },
  infoRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  infoKey: {
    fontSize: 13,
    color: '#6B7280'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A3B4C',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    paddingRight: 10
  },
  warningText: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    flex: 1
  },
  primaryBtn: {
    backgroundColor: '#3a7ca5',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#3a7ca5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  loadingArea: {
    alignItems: 'center',
    marginVertical: 10
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14
  }
});
