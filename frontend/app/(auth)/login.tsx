import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)/new-exam');
    } catch (e: any) {
      setError(e.message || 'Incorrect username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Activity color="#ffffff" size={32} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>DermScreen</Text>
          <Text style={styles.subtitle}>Healthcare Worker Portal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              value={username}
              onChangeText={t => { setUsername(t); setError(''); }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
              >
                {showPassword
                  ? <EyeOff color="#9ca3af" size={20} />
                  : <Eye color="#9ca3af" size={20} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.primaryBtnText}>Login</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.linkText}>Create account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#3A7CA5', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3A7CA5', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
    marginBottom: 16,
  },
  appName: { fontSize: 24, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  form: { width: '100%', gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 14, color: '#374151', fontWeight: '500' },
  input: {
    height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: '#111827', backgroundColor: '#ffffff',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  errorBox: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 12,
  },
  errorText: { color: '#ef4444', fontSize: 13 },
  primaryBtn: {
    height: 52, backgroundColor: '#3A7CA5', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3A7CA5', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#3A7CA5', fontSize: 14, fontWeight: '600' },
});
