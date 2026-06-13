import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import * as ImageManipulator from 'expo-image-manipulator';
import { ArrowLeft } from 'lucide-react-native';

export default function QualityCheckScreen() {
  const router = useRouter();
  const setQuality = useExamStore(state => state.setQuality);
  const originalUri = useExamStore(state => state.originalImageUri);
  const [statusText, setStatusText] = useState('Đang phân tích chất lượng ảnh...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!originalUri) return;
    runQualityCheck(originalUri);
  }, [originalUri]);

  const runQualityCheck = async (uri: string) => {
    try {
      // Giả lập quá trình phân tích
      await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 100 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );

      const pseudoBlurScore = Math.random() * 100 + 50;
      const pseudoLightingScore = Math.random() * 100 + 50; 
      const isPass = pseudoBlurScore > 100 && pseudoLightingScore > 50 && pseudoLightingScore < 200;

      setStatusText(`Độ nét: ${pseudoBlurScore.toFixed(0)}, Ánh sáng: ${pseudoLightingScore.toFixed(0)}`);
      
      setQuality({ 
        blurScore: pseudoBlurScore, 
        lightingScore: pseudoLightingScore, 
        passed: isPass 
      });

      setTimeout(() => {
        if (isPass) {
          router.push('/new-exam/mask');
        } else {
          setFailed(true);
        }
      }, 1500);

    } catch (e) {
      console.error('Quality check failed:', e);
      setStatusText('Lỗi khi xử lý ảnh');
      setFailed(true);
    }
  };

  const handleRetake = () => {
    router.back();
  };

  const handleForceContinue = () => {
    setQuality({ blurScore: 100, lightingScore: 100, passed: true });
    router.push('/new-exam/mask');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bước 2: Kiểm tra ảnh</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.info}>{statusText}</Text>

        {!failed ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3A7CA5" />
            <Text style={{marginTop: 15, color: '#666'}}>Vui lòng giữ máy...</Text>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Chất lượng ảnh không đạt yêu cầu (ảnh quá mờ hoặc quá tối).</Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRetake}>
              <Text style={styles.primaryBtnText}>Chụp lại ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleForceContinue}>
              <Text style={styles.secondaryBtnText}>Tiếp tục (Bỏ qua kiểm tra)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backBtn: { padding: 5, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  info: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#444' },
  loadingBox: { alignItems: 'center' },
  errorBox: { alignItems: 'center', width: '100%' },
  errorText: { color: '#d9534f', fontSize: 15, marginBottom: 40, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    backgroundColor: '#3A7CA5',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15
  },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center'
  },
  secondaryBtnText: { color: '#999', fontSize: 14 }
});
