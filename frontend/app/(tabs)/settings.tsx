import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, Info, Mail, ChevronRight, Activity } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useState } from 'react';
import { APP_VERSION, SUPPORT_EMAIL } from '../../src/config/constants';

export default function Settings() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const runLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        void runLogout();
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: runLogout,
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Activity color="#ffffff" size={22} strokeWidth={2.5} />
        </View>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                <User color="#3A7CA5" size={18} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Username</Text>
                <Text style={styles.rowValue}>{user?.username ?? '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
                <User color="#16a34a" size={18} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Role</Text>
                <Text style={styles.rowValue}>{user?.role === 'worker' ? 'Healthcare Worker' : user?.role ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f5f3ff' }]}>
                <Info color="#7c3aed" size={18} />
              </View>
              <View>
                <Text style={styles.rowLabel}>App Version</Text>
                <Text style={styles.rowValue}>{APP_VERSION}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                <Mail color="#ea580c" size={18} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Support</Text>
                <Text style={styles.rowValue}>{SUPPORT_EMAIL}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#ffffff" />
            : <>
                <LogOut color="#ffffff" size={18} />
                <Text style={styles.logoutText}>Logout</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  container: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  logoBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#3A7CA5',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#6b7280', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '500', color: '#111827' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 64 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ef4444', borderRadius: 14, height: 52,
    shadowColor: '#ef4444', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  logoutText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
