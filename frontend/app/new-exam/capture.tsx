import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { X } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CaptureScreen() {
  const router = useRouter();
  const setOriginalImage = useExamStore(state => state.setOriginalImage);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={{flex:1, backgroundColor:'#000'}} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Cần quyền truy cập Camera để tiếp tục</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Cấp quyền Camera</Text>
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
        console.error("Failed to capture image:", err);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Ép ẩn Header hệ thống một lần nữa để chắc chắn */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

      {/* Lớp Overlay phủ mờ xung quanh khung ngắm */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
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

      {/* UI Controls */}
      <View style={styles.uiOverlay} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chụp ảnh tổn thương</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.instructions}>Căn vùng tổn thương vào giữa khung hình</Text>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionText: { color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  permissionBtn: { backgroundColor: '#3A7CA5', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },

  // Mask Overlay
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  maskMiddle: { flexDirection: 'row', height: SCREEN_WIDTH * 0.75 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  targetFrame: { width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75, backgroundColor: 'transparent' },
  maskBottom: { flex: 2, backgroundColor: 'rgba(0,0,0,0.4)' },

  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 15 },

  footer: { alignItems: 'center', paddingBottom: 20 },
  instructions: { color: '#fff', marginBottom: 20, fontSize: 13, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  captureButton: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },

  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#4CAF50' },
  topLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 },
  topRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5 },
});
