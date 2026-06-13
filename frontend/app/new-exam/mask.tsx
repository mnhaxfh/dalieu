import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Canvas,
  Image as SkImage,
  Mask,
  Group,
  Path,
  Skia,
  Blur,
  useCanvasRef,
  SkPath,
  SkImage as SkiaImageType,
} from '@shopify/react-native-skia';
import { ArrowLeft } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Reserve space for header (~110px) and toolbar (~80px)
const MAX_CANVAS_HEIGHT = SCREEN_HEIGHT - 190;

export default function MaskScreen() {
  const router = useRouter();
  const originalUri = useExamStore(state => state.originalImageUri);
  const setMaskedImage = useExamStore(state => state.setMaskedImage);

  const canvasRef = useCanvasRef();
  const [skiaImage, setSkiaImage] = useState<SkiaImageType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);

  // ── Load image using Skia.Data.fromURI — correct API for local file:// URIs in Skia v2 ──
  useEffect(() => {
    if (!originalUri) {
      setLoadError('Không tìm thấy đường dẫn ảnh gốc.');
      return;
    }

    const uri =
      Platform.OS === 'android' && !originalUri.startsWith('file://')
        ? `file://${originalUri}`
        : originalUri;

    (async () => {
      try {
        // Skia v2: Skia.Data.fromURI is the async loader for file:// and https:// URIs
        const data = await Skia.Data.fromURI(uri);
        const img = Skia.Image.MakeImageFromEncoded(data);
        if (img) {
          setSkiaImage(img);
        } else {
          setLoadError('Không thể giải mã dữ liệu ảnh.');
        }
      } catch (e: any) {
        console.error('Error loading image for Skia:', e);
        setLoadError('Lỗi khi tải ảnh vào bộ lọc.');
      }
    })();
  }, [originalUri]);

  // ── Touch handlers ──
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
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath(null);
    }
  };

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleNext = async () => {
    if (!canvasRef.current) return;
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (snapshot) {
        const base64Data = snapshot.encodeToBase64();
        const fileUri = FileSystem.cacheDirectory + `masked_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setMaskedImage(fileUri, false, paths.length > 0);
        router.push('/new-exam/crop');
      }
    } catch (e) {
      console.error('Failed to export masked image:', e);
    }
  };

  // ── Error state ──
  if (loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: 'red', marginBottom: 20 }}>{loadError}</Text>
        <TouchableOpacity style={styles.undoBtn} onPress={() => router.back()}>
          <Text>Quay lại chụp lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Loading state ──
  if (!skiaImage) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#3A7CA5" />
        <Text style={{ marginTop: 10 }}>Đang chuẩn bị bộ lọc ảnh...</Text>
      </View>
    );
  }

  // Cap canvas height so toolbar is always visible
  const imgAspectRatio = skiaImage.width() / skiaImage.height();
  const naturalHeight = SCREEN_WIDTH / imgAspectRatio;
  const drawHeight = Math.min(naturalHeight, MAX_CANVAS_HEIGHT);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color="#333" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Bước 3: Che chắn</Text>
        </View>
        <Text style={styles.info}>
          Vẽ lên vùng nhạy cảm (hình xăm, mắt) để làm mờ.
        </Text>
      </View>

      {/* Canvas — fixed height so toolbar never gets pushed off screen */}
      <View
        style={[styles.canvasContainer, { height: drawHeight }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Canvas style={StyleSheet.absoluteFill} ref={canvasRef}>
          {/* Base image */}
          <SkImage
            image={skiaImage}
            x={0}
            y={0}
            width={SCREEN_WIDTH}
            height={drawHeight}
            fit="contain"
          />

          {/* Blur mask — only visible where the user drew */}
          <Mask
            mask={
              <Group>
                {paths.map((p, index) => (
                  <Path
                    key={index}
                    path={p}
                    color="white"
                    style="stroke"
                    strokeWidth={50}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                ))}
                {currentPath && (
                  <Path
                    path={currentPath}
                    color="white"
                    style="stroke"
                    strokeWidth={50}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                )}
              </Group>
            }
          >
            <SkImage
              image={skiaImage}
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={drawHeight}
              fit="contain"
            >
              <Blur blur={25} />
            </SkImage>
          </Mask>
        </Canvas>
      </View>

      {/* Toolbar — always visible at the bottom */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.undoBtn, paths.length === 0 && styles.undoBtnDisabled]}
          onPress={handleUndo}
          disabled={paths.length === 0}
        >
          <Text style={{ color: paths.length === 0 ? '#ccc' : '#555' }}>
            Hoàn tác (Undo)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tiếp tục →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: { padding: 20, paddingTop: 50 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  backBtn: { padding: 5, marginRight: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  info: { fontSize: 13, color: '#666' },
  canvasContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  undoBtn: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  undoBtnDisabled: { borderColor: '#eee' },
  nextBtn: {
    padding: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
    backgroundColor: '#28a745',
  },
});
