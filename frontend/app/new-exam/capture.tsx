import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_WIDTH * 0.75;

export default function CaptureScreen() {
  const router = useRouter();
  const setOriginalImage = useExamStore(state => state.setOriginalImage);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Cần quyền truy cập Camera để tiếp tục</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });

        if (photo && photo.uri) {
          setOriginalImage(photo.uri);
          router.push('/new-exam/quality-check');
        }
      } catch (err) {
        console.error('Failed to capture image:', err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      {/* Lớp Overlay phủ mờ - Căn giữa tuyệt đối */}
      <View style={styles.overlayContainer} pointerEvents="none">
        <View style={styles.maskTop} />
        <View style={styles.maskMiddle}>
          <View style={styles.maskSide} />
          <View style={styles.targetFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom} />
      </View>

      {/* Nút quay lại - cố định trên cùng */}
      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chụp ảnh tổn thương</Text>
      </View>

      {/* Nút chụp ảnh - cố định dưới cùng */}
      <View style={styles.footer} pointerEvents="box-none">
        <Text style={styles.instructions}>Căn vùng tổn thương vào giữa khung hình</Text>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  permissionText: { color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  permissionBtn: { backgroundColor: '#3A7CA5', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },

  overlayContainer: { ...StyleSheet.absoluteFillObject },
  // maskTop và maskBottom bằng nhau (flex: 1) => targetFrame ở chính giữa màn hình
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  maskMiddle: { flexDirection: 'row', height: FRAME_SIZE },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  targetFrame: { width: FRAME_SIZE, height: FRAME_SIZE, backgroundColor: 'transparent' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },

  // Header neo TRÊN CÙNG bằng absolute
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 15 },

  // Footer neo DƯỚI CÙNG bằng absolute
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#4CAF50' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5 },
});
