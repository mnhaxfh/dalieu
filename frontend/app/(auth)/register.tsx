import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !fullName.trim() || !password || !confirmPassword) {
      setError('All fields are required.'); return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username.trim(), fullName.trim(), 'worker', password);
      router.replace('/(tabs)/new-exam');
    } catch (e: any) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft color="#3A7CA5" size={20} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Activity color="#ffffff" size={32} strokeWidth={2.5} />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.subtitle}>Join the DermScreen network</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'Your full name', secure: false },
            { label: 'Username', value: username, set: setUsername, placeholder: 'Choose a username', secure: false },
          ].map(({ label, value, set, placeholder }) => (
            <View key={label} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                value={value}
                onChangeText={t => { set(t); setError(''); }}
              />
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Min. 8 characters"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff color="#9ca3af" size={20} /> : <Eye color="#9ca3af" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); setError(''); }}
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  back: { alignSelf: 'flex-start', marginBottom: 16, padding: 4 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: '#3A7CA5',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3A7CA5', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8,
    marginBottom: 16,
  },
  appName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  form: { width: '100%', gap: 14, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 14, color: '#374151', fontWeight: '500' },
  input: {
    height: 48, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: '#111827', backgroundColor: '#ffffff',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12 },
  errorText: { color: '#ef4444', fontSize: 13 },
  primaryBtn: {
    height: 52, backgroundColor: '#3A7CA5', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3A7CA5', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#3A7CA5', fontWeight: '600' },
});
