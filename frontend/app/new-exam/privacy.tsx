import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function PrivacyScreen() {
  const router = useRouter();
  const sessionId = useExamStore(state => state.sessionId);
  const [agreed, setAgreed] = useState(false);

  const handleNext = () => {
    if (!agreed) {
      alert("Vui lòng đồng ý với các điều khoản bảo mật thông tin trước khi tiếp tục.");
      return;
    }
    router.push('/new-exam/capture');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#2A3B4C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>2. Quyền riêng tư</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.caseIdLabel}>Mã ca khám:</Text>
          <Text style={styles.caseIdValue}>PT-{sessionId.substring(0, 6).toUpperCase()}</Text>

          <View style={styles.consentBox}>
            <Text style={styles.consentTitle}>ĐỒNG THUẬN DỮ LIỆU AI</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Ảnh sẽ được tự động xóa dữ liệu định vị GPS.</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Các thông tin cá nhân định danh sẽ được ẩn đi.</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Hình ảnh chỉ được sử dụng cho mục đích phân tích học máy AI để chẩn đoán lâm sàng.</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <CheckCircle2 size={20} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Tôi đồng ý chia sẻ ẩn danh</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryBtn, !agreed && styles.primaryBtnDisabled]} 
            onPress={handleNext}
            disabled={!agreed}
          >
            <Text style={styles.primaryBtnText}>Bật Camera →</Text>
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
  caseIdLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  caseIdValue: { fontSize: 20, fontWeight: 'bold', color: '#2A3B4C', marginBottom: 20 },
  consentBox: {
    backgroundColor: '#F0F4FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2A3B4C',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  bullet: {
    fontSize: 16,
    color: '#138E66',
    marginRight: 8,
    lineHeight: 18
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    alignSelf: 'center'
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A3B4C',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  checkboxChecked: {
    backgroundColor: '#5A73F3',
    borderColor: '#2A3B4C'
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A3B4C'
  },
  primaryBtn: {
    backgroundColor: '#5A73F3',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#5A73F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  primaryBtnDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
