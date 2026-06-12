import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        // Logged in healthcare worker defaults to the New Exam stepper
        router.replace('/(tabs)/new-exam');
      } else {
        // Direct to login
        router.replace('/(auth)/login');
      }
    }
  }, [token, isLoading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3A7CA5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
