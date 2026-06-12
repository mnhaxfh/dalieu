import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, User, Calendar, AlertTriangle, CheckCircle,
  Clock, Stethoscope, AlertOctagon,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { STATIC_BASE_URL } from '../../src/config/constants';

interface Examination {
  id: number;
  patient_id: string;
  photo_url: string;
  age: number;
  sex: string;
  chief_complaint: string;
  known_conditions: Record<string, string> | null;
  status: string;
  doctor_feedback: string | null;
  worker_id: number;
  doctor_id: number | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Pending:       { color: '#92400e', bg: '#fef3c7', icon: Clock },
  'Under Review':{ color: '#1e40af', bg: '#dbeafe', icon: Stethoscope },
  Completed:     { color: '#065f46', bg: '#d1fae5', icon: CheckCircle },
  Urgent:        { color: '#991b1b', bg: '#fee2e2', icon: AlertTriangle },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function CaseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [exam, setExam] = useState<Examination | null>(null);
  const [loading, setLoading] = useState(true);
  const [urgentLoading, setUrgentLoading] = useState(false);

  const fetchExam = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await api.examinations.get(id, token);
      setExam(data);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load examination.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchExam();
  }, [fetchExam]));

  const handleFlagUrgent = () => {
    Alert.alert(
      'Flag as Urgent',
      'This will mark the case as Urgent and notify the doctor. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag Urgent',
          style: 'destructive',
          onPress: async () => {
            if (!token || !exam) return;
            setUrgentLoading(true);
            try {
              const updated = await api.examinations.markUrgent(exam.id, token);
              setExam(updated);
              Alert.alert('Flagged', 'Case has been marked as Urgent.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to flag as urgent.');
            } finally {
              setUrgentLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#3A7CA5" />
      </View>
    );
  }

  if (!exam) return null;

  const cfg = STATUS_CONFIG[exam.status] ?? { color: '#374151', bg: '#f3f4f6', icon: Clock };
  const StatusIcon = cfg.icon;
  const isReviewed = exam.status === 'Completed' || exam.status === 'Urgent';
  const photoUrl = exam.photo_url
    ? (exam.photo_url.startsWith('http')
        ? exam.photo_url
        : `${STATIC_BASE_URL}${exam.photo_url.startsWith('/') ? '' : '/'}${exam.photo_url}`)
    : null;

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Photo */}
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={s.photo} resizeMode="cover" />
        ) : (
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>No photo available</Text>
          </View>
        )}

        {/* Status Banner */}
        <View style={[s.statusBanner, { backgroundColor: cfg.bg }]}>
          <StatusIcon color={cfg.color} size={18} />
          <Text style={[s.statusText, { color: cfg.color }]}>{exam.status}</Text>
        </View>

        {/* Section 1: Patient Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUBMITTED DATA</Text>
          <View style={s.card}>
            <InfoRow label="Patient ID" value={exam.patient_id} mono />
            <Divider />
            <View style={s.twoCol}>
              <InfoRow label="Age" value={`${exam.age} years`} />
              <InfoRow label="Sex" value={exam.sex} />
            </View>
            <Divider />
            <InfoRow label="Chief Complaint" value={exam.chief_complaint} multiline />
            {exam.known_conditions && Object.keys(exam.known_conditions).length > 0 && (
              <>
                <Divider />
                <View style={s.infoBlock}>
                  <Text style={s.infoLabel}>Known Conditions</Text>
                  {Object.entries(exam.known_conditions).map(([key, val]) => (
                    <View key={key} style={s.conditionRow}>
                      <View style={s.conditionDot} />
                      <Text style={s.conditionText}>
                        <Text style={s.conditionKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                        {val && val !== 'yes' ? `: ${val}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <Divider />
            <InfoRow label="Submitted" value={formatDate(exam.created_at)} />
          </View>
        </View>

        {/* Section 2: Doctor's Review */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>DOCTOR'S REVIEW</Text>
          <View style={s.card}>
            {isReviewed && exam.doctor_feedback ? (
              <View style={s.feedbackBox}>
                <Stethoscope color="#3A7CA5" size={18} />
                <Text style={s.feedbackText}>{exam.doctor_feedback}</Text>
              </View>
            ) : (
              <View style={s.awaitingBox}>
                <Clock color="#9ca3af" size={20} />
                <Text style={s.awaitingText}>Awaiting doctor's review</Text>
              </View>
            )}
          </View>
        </View>

        {/* Flag as Urgent */}
        {exam.status !== 'Urgent' && (
          <View style={s.section}>
            <TouchableOpacity
              style={[s.urgentBtn, urgentLoading && s.btnDisabled]}
              onPress={handleFlagUrgent}
              disabled={urgentLoading}
              activeOpacity={0.85}
            >
              {urgentLoading
                ? <ActivityIndicator color="#ffffff" />
                : <>
                    <AlertOctagon color="#ffffff" size={18} />
                    <Text style={s.urgentBtnText}>Flag as Urgent</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, mono = false, multiline = false }: {
  label: string; value: string; mono?: boolean; multiline?: boolean;
}) {
  return (
    <View style={s.infoBlock}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, mono && s.mono]}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#1f2937' },
  photoPlaceholder: {
    width: '100%', aspectRatio: 4 / 3, backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  photoPlaceholderText: { color: '#9ca3af', fontSize: 14 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  infoBlock: { paddingHorizontal: 16, paddingVertical: 12, gap: 3 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '500', lineHeight: 22 },
  mono: { fontVariant: ['tabular-nums'], fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
  twoCol: { flexDirection: 'row' },
  conditionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  conditionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3A7CA5', marginTop: 6 },
  conditionText: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 22 },
  conditionKey: { fontWeight: '600' },
  feedbackBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  feedbackText: { flex: 1, fontSize: 14, color: '#111827', lineHeight: 22 },
  awaitingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  awaitingText: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  urgentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ef4444', borderRadius: 14, height: 52,
    shadowColor: '#ef4444', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  urgentBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

import { Platform } from 'react-native';
