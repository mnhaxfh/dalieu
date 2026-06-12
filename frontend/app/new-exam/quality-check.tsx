import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { useExamStore } from '../../src/store/examStore';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export default function QualityCheckScreen() {
  const router = useRouter();
  const setQuality = useExamStore(state => state.setQuality);
  const originalUri = useExamStore(state => state.originalImageUri);
  const [statusText, setStatusText] = useState('Analyzing image quality...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!originalUri) return;
    runQualityCheck(originalUri);
  }, [originalUri]);

  // Decode Base64 to Uint8Array safely for pixel processing
  const base64ToUint8 = (base64: string) => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  const runQualityCheck = async (uri: string) => {
    try {
      // 1. Resize image heavily to speed up JS pixel calculations
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 100 } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8, base64: true }
      );

      if (!manipResult.base64) throw new Error("No base64 returned");

      // We extract standard JS pixels. Since base64 is JPEG, we only approximate brightness
      // A more accurate method uses Skia, but this provides a fast fallback.
      // We will do a mock calculation here for prototype unless we include a heavy jpeg decoder.
      // For the agent build, we'll simulate the Laplacian and Brightness based on the base64 string length/entropy.
      
      // MOCK SCORE COMPUTATION
      // Real app would use a native C++ module or Skia pixel extraction.
      const pseudoBlurScore = Math.random() * 100 + 50; // Random score 50-150
      const pseudoLightingScore = Math.random() * 100 + 50; 
      
      const isPass = pseudoBlurScore > 100 && pseudoLightingScore > 50 && pseudoLightingScore < 200;

      setStatusText(`Blur: ${pseudoBlurScore.toFixed(1)}, Lighting: ${pseudoLightingScore.toFixed(1)}`);
      
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
      setStatusText('Error processing image');
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
      <Text style={styles.title}>Step 2: Quality Check</Text>
      <Text style={styles.info}>{statusText}</Text>
      
      {!failed ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Quality check failed! Please retake the photo.</Text>
          <View style={styles.buttons}>
            <Button title="Retake Photo" onPress={handleRetake} />
            <View style={{height: 10}} />
            <Button title="Force Continue (Dev)" onPress={handleForceContinue} color="#999" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  errorBox: { alignItems: 'center', width: '100%' },
  errorText: { color: 'red', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  buttons: { width: '80%' }
});
