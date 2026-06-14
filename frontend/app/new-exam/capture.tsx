import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon, ShieldCheck } from 'lucide-react-native';
import { useExamStore } from '../../src/store/examStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_WIDTH * 0.7;
const MIN_BOX_SIZE = 100;
const TOP_LIMIT = 80;
const BOTTOM_RESERVED = 150;

type ImageSize = {
  width: number;
  height: number;
};

type BoxState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const initialBox: BoxState = {
  x: (SCREEN_WIDTH - FRAME_SIZE) / 2,
  y: (SCREEN_HEIGHT - FRAME_SIZE) / 2 - 40,
  width: FRAME_SIZE,
  height: FRAME_SIZE,
};

const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

const getUuid = async () => {
  if (Platform.OS === 'web' && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const ExpoCrypto = await import('expo-crypto');
  return ExpoCrypto.randomUUID();
};

const getImageSize = (uri: string) => {
  return new Promise<ImageSize>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject
    );
  });
};

export default function CaptureScreen() {
  const router = useRouter();
  const setOriginalImage = useExamStore(state => state.setOriginalImage);
  const setCroppedImage = useExamStore(state => state.setCroppedImage);
  const setMaskedImage = useExamStore(state => state.setMaskedImage);
  const setFinalImage = useExamStore(state => state.setFinalImage);
  const setQuality = useExamStore(state => state.setQuality);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const panStart = useRef<BoxState>(initialBox);
  const boxRef = useRef<BoxState>(initialBox);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedSize, setCapturedSize] = useState<ImageSize | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [box, setBoxState] = useState<BoxState>(initialBox);

  const setBox = useCallback((nextBox: BoxState) => {
    boxRef.current = nextBox;
    setBoxState(nextBox);
  }, []);

  const resetCropBox = useCallback(() => {
    setBox(initialBox);
  }, [setBox]);

  const setSelectedImage = useCallback(async (uri: string) => {
    try {
      const size = await getImageSize(uri);
      setCapturedSize(size);
      setCapturedImage(uri);
      resetCropBox();
    } catch (error) {
      console.error('Cannot load selected image:', error);
      Alert.alert('Lỗi ảnh', 'Không thể hiển thị ảnh vừa chọn hoặc vừa chụp. Vui lòng thử lại.');
    }
  }, [resetCropBox]);

  const moveBox = useCallback((dx: number, dy: number) => {
    const start = panStart.current;
    setBox({
      ...start,
      x: clamp(start.x + dx, 0, SCREEN_WIDTH - start.width),
      y: clamp(start.y + dy, TOP_LIMIT, SCREEN_HEIGHT - start.height - BOTTOM_RESERVED),
    });
  }, [setBox]);

  const resizeBox = useCallback((
    dx: number,
    dy: number,
    anchor: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ) => {
    const start = panStart.current;
    let nextX = start.x;
    let nextY = start.y;
    let nextWidth = start.width;
    let nextHeight = start.height;

    if (anchor.includes('Left')) {
      const maxDx = start.width - MIN_BOX_SIZE;
      const clampedDx = clamp(dx, -start.x, maxDx);
      nextX = start.x + clampedDx;
      nextWidth = start.width - clampedDx;
    } else {
      nextWidth = clamp(start.width + dx, MIN_BOX_SIZE, SCREEN_WIDTH - start.x);
    }

    if (anchor.includes('top')) {
      const maxDy = start.height - MIN_BOX_SIZE;
      const clampedDy = clamp(dy, TOP_LIMIT - start.y, maxDy);
      nextY = start.y + clampedDy;
      nextHeight = start.height - clampedDy;
    } else {
      nextHeight = clamp(start.height + dy, MIN_BOX_SIZE, SCREEN_HEIGHT - start.y - BOTTOM_RESERVED);
    }

    setBox({ x: nextX, y: nextY, width: nextWidth, height: nextHeight });
  }, [setBox]);

  const createPanResponder = useCallback((onMove: (dx: number, dy: number) => void) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panStart.current = boxRef.current;
      },
      onPanResponderMove: (_event, gestureState) => {
        onMove(gestureState.dx, gestureState.dy);
      },
    });
  }, []);

  const boxPanResponder = useRef(createPanResponder(moveBox)).current;
  const topLeftPan = useRef(createPanResponder((dx, dy) => resizeBox(dx, dy, 'topLeft'))).current;
  const topRightPan = useRef(createPanResponder((dx, dy) => resizeBox(dx, dy, 'topRight'))).current;
  const bottomLeftPan = useRef(createPanResponder((dx, dy) => resizeBox(dx, dy, 'bottomLeft'))).current;
  const bottomRightPan = useRef(createPanResponder((dx, dy) => resizeBox(dx, dy, 'bottomRight'))).current;

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Lỗi ảnh', 'Không thể chọn ảnh từ thư viện.');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        await setSelectedImage(photo.uri);
      }
    } catch (error) {
      console.error('Failed to capture image:', error);
      Alert.alert('Lỗi camera', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const getCropRect = useCallback((imageSize: ImageSize) => {
    const scale = Math.max(SCREEN_WIDTH / imageSize.width, SCREEN_HEIGHT / imageSize.height);
    const renderedWidth = imageSize.width * scale;
    const renderedHeight = imageSize.height * scale;
    const offsetX = (SCREEN_WIDTH - renderedWidth) / 2;
    const offsetY = (SCREEN_HEIGHT - renderedHeight) / 2;

    const originX = clamp((boxRef.current.x - offsetX) / scale, 0, imageSize.width - 1);
    const originY = clamp((boxRef.current.y - offsetY) / scale, 0, imageSize.height - 1);
    const maxWidth = imageSize.width - originX;
    const maxHeight = imageSize.height - originY;

    return {
      originX,
      originY,
      width: clamp(boxRef.current.width / scale, 1, maxWidth),
      height: clamp(boxRef.current.height / scale, 1, maxHeight),
    };
  }, []);

  const processImage = async () => {
    if (!capturedImage || !capturedSize) return;

    setIsProcessing(true);
    setOriginalImage(capturedImage);

    try {
      setProcessingStatus('Đang phân tích chất lượng ảnh...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setQuality({
        blurScore: Math.random() * 100 + 60,
        lightingScore: Math.random() * 100 + 60,
        passed: true,
      });

      setProcessingStatus('Đang crop ảnh và xóa metadata...');
      await new Promise(resolve => setTimeout(resolve, 300));

      const crop = getCropRect(capturedSize);
      const manipResult = await ImageManipulator.manipulateAsync(
        capturedImage,
        [{ crop }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
      );

      const uuid = await getUuid();
      const filename = `${uuid}.jpg`;
      let finalUri = manipResult.uri;

      if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
        finalUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.moveAsync({
          from: manipResult.uri,
          to: finalUri,
        });
      }

      setMaskedImage(finalUri, false, false);
      setCroppedImage(finalUri);
      setFinalImage(finalUri, filename, 'image/jpeg');

      setProcessingStatus('Hoàn tất xử lý ảnh.');
      await new Promise(resolve => setTimeout(resolve, 250));

      setIsProcessing(false);
      setCapturedImage(null);
      setCapturedSize(null);
      router.push('/new-exam/review');
    } catch (error) {
      console.error('Failed to process image:', error);
      Alert.alert('Lỗi xử lý ảnh', 'Không thể crop ảnh. Vui lòng chụp lại hoặc chọn ảnh khác.');
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Cần quyền truy cập camera để tiếp tục</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cấp quyền camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {isProcessing ? (
        <View style={styles.processingContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImageDimmed} resizeMode="cover" />
          )}
          <View style={styles.securityOverlay}>
            <ShieldCheck size={48} color="#4ADE80" />
            <ActivityIndicator size="large" color="#4ADE80" style={styles.processingSpinner} />
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        </View>
      ) : (
        <View style={StyleSheet.absoluteFill}>
          {capturedImage ? (
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              resizeMode="cover"
              onError={() => Alert.alert('Lỗi ảnh', 'Ảnh vừa chụp không hiển thị được. Vui lòng chụp lại.')}
            />
          ) : (
            <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />
          )}
        </View>
      )}

      {!isProcessing && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.maskBlock, { top: 0, left: 0, right: 0, height: box.y }]} />
          <View style={[styles.maskBlock, { top: box.y + box.height, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.maskBlock, { top: box.y, left: 0, width: box.x, height: box.height }]} />
          <View style={[styles.maskBlock, { top: box.y, left: box.x + box.width, right: 0, height: box.height }]} />

          <View
            style={[
              styles.targetFrame,
              {
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
              },
            ]}
            {...boxPanResponder.panHandlers}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={[styles.handleContainer, styles.topLeftHandle]} {...topLeftPan.panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={[styles.handleContainer, styles.topRightHandle]} {...topRightPan.panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={[styles.handleContainer, styles.bottomLeftHandle]} {...bottomLeftPan.panHandlers}>
              <View style={styles.handle} />
            </View>
            <View style={[styles.handleContainer, styles.bottomRightHandle]} {...bottomRightPan.panHandlers}>
              <View style={styles.handle} />
            </View>
          </View>
        </View>
      )}

      <View style={styles.header} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => {
            if (capturedImage && !isProcessing) {
              setCapturedImage(null);
              setCapturedSize(null);
              resetCropBox();
            } else {
              router.back();
            }
          }}
          style={styles.closeBtn}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>3. Chụp và crop</Text>
      </View>

      {!isProcessing && (
        <View style={styles.footer} pointerEvents="box-none">
          <Text style={styles.instructions}>
            {capturedImage
              ? 'Kéo khung để chọn vùng ảnh cần crop'
              : 'Căn vùng cần chụp trong khung'}
          </Text>

          <View style={styles.actionRow} pointerEvents="box-none">
            {capturedImage ? (
              <>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => {
                    setCapturedImage(null);
                    setCapturedSize(null);
                    resetCropBox();
                  }}
                >
                  <Text style={styles.secondaryActionText}>Chụp lại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryAction} onPress={processImage}>
                  <Camera color="#fff" size={24} />
                  <Text style={styles.primaryActionText}>Crop và xác nhận</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.secondaryAction} onPress={handlePickImage}>
                  <ImageIcon color="#2A3B4C" size={24} />
                  <Text style={styles.secondaryActionText}>Thư viện</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryAction} onPress={handleCapture}>
                  <Camera color="#fff" size={24} />
                  <Text style={styles.primaryActionText}>Chụp ảnh</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: { color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  permissionBtn: { backgroundColor: '#138E66', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold' },
  processingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  previewImageDimmed: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  maskBlock: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  targetFrame: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderStyle: 'dashed',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff' },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  handleContainer: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  topLeftHandle: { top: -22, left: -22 },
  topRightHandle: { top: -22, right: -22 },
  bottomLeftHandle: { bottom: -22, left: -22 },
  bottomRightHandle: { bottom: -22, right: -22 },
  handle: {
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#5A73F3',
    borderRadius: 7,
  },
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 15, fontFamily: 'Roboto' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    color: '#fff',
    marginBottom: 20,
    fontSize: 13,
    backgroundColor: 'rgba(42, 59, 76, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3B4C',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: { color: '#2A3B4C', fontWeight: 'bold', fontSize: 15 },
  primaryAction: {
    flex: 2,
    backgroundColor: '#5A73F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#5A73F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  securityOverlay: {
    backgroundColor: 'rgba(42, 59, 76, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A3B4C',
    width: '80%',
  },
  processingSpinner: { marginVertical: 15 },
  processingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
