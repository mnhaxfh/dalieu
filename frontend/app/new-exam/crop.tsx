import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export default function CropScreen() {
  const router = useRouter();
  const maskedImageUri = useExamStore(state => state.maskedImageUri);
  const setCroppedImage = useExamStore(state => state.setCroppedImage);
  const setFinalImage = useExamStore(state => state.setFinalImage);
  
  const [processing, setProcessing] = useState(false);

  const handleCrop = async () => {
    if (!maskedImageUri) return;
    setProcessing(true);

    try {
      // 1. Lấy thông tin kích thước gốc của ảnh
      // (Trong thực tế ta có thể lấy qua Image.getSize, ở đây dùng mặc định cắt center)
      // expo-image-manipulator yêu cầu biết Origin width/height hoặc chỉ định crop box.
      // Dùng Image.getSize để lấy chính xác:
      Image.getSize(maskedImageUri, async (width, height) => {
        // Cắt 60% ở giữa màn hình như Document yêu cầu
        const cropWidth = width * 0.6;
        const cropHeight = height * 0.6;
        const originX = (width - cropWidth) / 2;
        const originY = (height - cropHeight) / 2;

        // 2. Manipulate: Crop ảnh & Xóa sạch EXIF tự động
        const manipResult = await ImageManipulator.manipulateAsync(
          maskedImageUri,
          [
            { 
              crop: { 
                originX: originX, 
                originY: originY, 
                width: cropWidth, 
                height: cropHeight 
              } 
            }
          ],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 1.0 }
        );

        // 3. Rename file bằng UUID v4 để bảo mật
        let uuidStr;
        if (Platform.OS === 'web' && typeof globalThis.crypto?.randomUUID === 'function') {
          uuidStr = globalThis.crypto.randomUUID();
        } else {
          const ExpoCrypto = await import('expo-crypto');
          uuidStr = ExpoCrypto.randomUUID();
        }
        const uuidFilename = `${uuidStr}.jpg`;
        const finalUri = FileSystem.cacheDirectory + uuidFilename;
        
        await FileSystem.moveAsync({
          from: manipResult.uri,
          to: finalUri
        });

        // 4. Lưu lại vào Global Store
        setCroppedImage(finalUri);
        setFinalImage(finalUri, uuidFilename, 'image/jpeg');

        setProcessing(false);
        router.push('/new-exam/demographics');
      }, (error) => {
        console.error("Lỗi lấy kích thước ảnh:", error);
        setProcessing(false);
      });
      
    } catch (error) {
      console.error("Crop failed:", error);
      alert("Cắt ảnh thất bại, vui lòng thử lại.");
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 4: Crop Image</Text>
      <Text style={styles.info}>
        Hệ thống sẽ cắt tập trung vào vùng tổn thương (60% ở giữa), đồng thời xóa sạch toàn bộ metadata/EXIF để bảo vệ danh tính bệnh nhân.
      </Text>
      
      {maskedImageUri && (
        <Image 
          source={{ uri: maskedImageUri }} 
          style={styles.previewImage} 
          resizeMode="contain" 
        />
      )}

      {processing ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.buttonWrapper}>
          <Button title="Crop Image & Generate Clean Bitmap" onPress={handleCrop} color="#007BFF" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
  info: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#444' },
  previewImage: {
    width: 300,
    height: 400,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 20
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10
  }
});


