import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import * as FileSystem from 'expo-file-system';
import { 
  Canvas, 
  useImage, 
  Image as SkImage, 
  Mask, 
  Group, 
  Path, 
  Skia, 
  Blur,
  useCanvasRef,
  SkPath
} from '@shopify/react-native-skia';
import { ArrowLeft } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MaskScreen() {
  const router = useRouter();
  const originalUri = useExamStore(state => state.originalImageUri);
  const setMaskedImage = useExamStore(state => state.setMaskedImage);
  
  const canvasRef = useCanvasRef();

  // Đảm bảo URI có file:// cho Android
  const imageSource = originalUri && !originalUri.startsWith('file://') && !originalUri.startsWith('http')
    ? `file://${originalUri}`
    : originalUri;

  const image = useImage(imageSource || '');
  
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);

  const handleTouchStart = ({ nativeEvent }: any) => {
    const { locationX, locationY } = nativeEvent;
    const path = Skia.Path.Make();
    path.moveTo(locationX, locationY);
    setCurrentPath(path);
  };

  const handleTouchMove = ({ nativeEvent }: any) => {
    if (!currentPath) return;
    const { locationX, locationY } = nativeEvent;
    const newPath = currentPath.copy();
    newPath.lineTo(locationX, locationY);
    setCurrentPath(newPath);
  };

  const handleTouchEnd = () => {
    if (currentPath) {
      setPaths([...paths, currentPath]);
      setCurrentPath(null);
    }
  };

  const handleUndo = () => {
    setPaths(paths.slice(0, -1));
  };

  const handleNext = async () => {
    if (!canvasRef.current) return;
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (snapshot) {
        const base64Data = snapshot.encodeToBase64(Skia.ImageFormat.JPEG, 90);
        const fileUri = FileSystem.cacheDirectory + `masked_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setMaskedImage(fileUri, false, paths.length > 0);
        router.push('/new-exam/crop');
      }
    } catch (e) {
      console.error("Failed to export masked image:", e);
    }
  };

  if (!image) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3A7CA5" />
        <Text style={{marginTop: 10}}>Đang tải ảnh xử lý...</Text>
        <Text style={{fontSize: 10, color: '#999', marginTop: 5}}>{originalUri}</Text>
      </View>
    );
  }

  const imgAspectRatio = image.width() / image.height();
  const drawHeight = SCREEN_WIDTH / imgAspectRatio;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Bước 3: Che chắn</Text>
        </View>
        <Text style={styles.info}>Vẽ lên vùng nhạy cảm (hình xăm, mắt) để làm mờ.</Text>
      </View>

      <View 
        style={[styles.canvasContainer, { height: drawHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Canvas style={{ flex: 1 }} ref={canvasRef}>
          <SkImage image={image} x={0} y={0} width={SCREEN_WIDTH} height={drawHeight} />

          <Mask
            mask={
              <Group>
                {paths.map((p, index) => (
                  <Path key={index} path={p} color="white" style="stroke" strokeWidth={40} strokeCap="round" strokeJoin="round" />
                ))}
                {currentPath && (
                  <Path path={currentPath} color="white" style="stroke" strokeWidth={40} strokeCap="round" strokeJoin="round" />
                )}
              </Group>
            }
          >
            <SkImage image={image} x={0} y={0} width={SCREEN_WIDTH} height={drawHeight}>
              <Blur blur={20} />
            </SkImage>
          </Mask>
        </Canvas>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.undoBtn} onPress={handleUndo} disabled={paths.length === 0}>
          <Text style={{color: paths.length === 0 ? '#ccc' : '#555'}}>Hoàn tác (Undo)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  backBtn: { padding: 5, marginRight: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  info: { fontSize: 13, color: '#666' },
  canvasContainer: { width: SCREEN_WIDTH, backgroundColor: '#000' },
  toolbar: { flexDirection: 'row', padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  undoBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  nextBtn: { padding: 12, paddingHorizontal: 35, borderRadius: 8, backgroundColor: '#28a745' }
});
