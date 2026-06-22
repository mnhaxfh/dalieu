import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter, Stack } from "expo-router";
import { useExamStore } from "../../src/store/examStore";
import {
  ShieldCheck,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  ArrowLeft
} from "lucide-react-native";

export default function CameraCropScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const setOriginalImage = useExamStore(state => state.setOriginalImage);
  const setFinalImage = useExamStore(state => state.setFinalImage);

  // Hàm xử lý xóa Metadata và chuẩn hóa ảnh
  const processAndConfirm = async () => {
    if (!image) return;

    setIsProcessing(true);
    try {
      // ImageManipulator.manipulateAsync mặc định sẽ xóa sạch EXIF/Metadata khi tạo file mới
      const result = await ImageManipulator.manipulateAsync(
        image,
        [], // Không cần thay đổi kích thước, chỉ cần tạo file mới để xóa metadata
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Lưu vào store
      setOriginalImage(image);
      setFinalImage(result.uri, `exam_${Date.now()}.jpg`, "image/jpeg");

      // Chuyển sang bước tiếp theo (Review)
      router.push("/new-exam/review");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xử lý bảo mật cho ảnh. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true, // Mở UI crop của hệ thống
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#2A3B4C" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>3. Chụp và Crop ảnh</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.previewContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <ImageIcon size={48} color="#ccc" />
              <Text style={styles.placeholderText}>Chưa có ảnh</Text>
            </View>
          )}
        </View>

        {image ? (
          <View style={styles.confirmSection}>
            <View style={styles.securityNote}>
              <ShieldCheck size={16} color="#4CAF50" />
              <Text style={styles.securityText}>Ảnh sẽ được xóa Metadata bảo mật</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={processAndConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.confirmText}>Xác nhận & Tiếp tục</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.retakeBtn} onPress={() => setImage(null)}>
              <Text style={styles.retakeText}>Chụp lại ảnh khác</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.btn} onPress={takePhoto}>
              <Camera size={24} color="#fff" />
              <Text style={styles.text}>Chụp ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.secondaryBtn]} onPress={pickPhoto}>
              <ImageIcon size={24} color="#3a7ca5" />
              <Text style={[styles.text, styles.secondaryText]}>Thư viện</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: '#3a7ca5',
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 20
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  previewContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
    marginBottom: 32,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  placeholderText: {
    marginTop: 12,
    color: "#9CA3AF",
    fontSize: 16,
  },
  buttonRow: {
    gap: 16,
  },
  btn: {
    backgroundColor: "#3a7ca5",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3a7ca5",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryText: {
    color: "#3a7ca5",
  },
  confirmSection: {
    alignItems: "center",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#3a7ca5",
    width: "100%",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    elevation: 2,
  },
  confirmText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  retakeBtn: {
    marginTop: 20,
    padding: 10,
  },
  retakeText: {
    color: "#6B7280",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});