import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Camera, Clock, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { resolveStaticUrl } from '../../src/config/constants';

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

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Pending:       { color: '#92400e', bg: '#fef3c7', label: 'Pending' },
  'Under Review':{ color: '#1e40af', bg: '#dbeafe', label: 'Under Review' },
  Completed:     { color: '#065f46', bg: '#d1fae5', label: 'Completed' },
  Urgent:        { color: '#991b1b', bg: '#fee2e2', label: 'Urgent' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: '#374151', bg: '#f3f4f6', label: status };
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 12, fontWeight: '600' },
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function ExamThumbnail({ photoUrl }: { photoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolveStaticUrl(photoUrl);

  if (!resolvedUrl || failed) {
    return (
      <View style={s.thumbnailFallback}>
        <Camera color="#9ca3af" size={18} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUrl }}
      style={s.thumbnail}
      resizeMode="cover"
      onError={() => {
        console.warn('Failed to load history thumbnail:', resolvedUrl);
        setFailed(true);
      }}
    />
  );
}

export default function History() {
  const router = useRouter();
  const { token } = useAuth();

  const [items, setItems] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const fetchExams = useCallback(async (p: number, append = false) => {
    if (!token) return;
    try {
      const data = await api.examinations.list(p, PAGE_SIZE, token);
      setTotal(data.total);
      setItems(prev => append ? [...prev, ...data.items] : data.items);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    setPage(1);
    fetchExams(1, false);
  }, [fetchExams]));

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchExams(1, false);
  };

  const goNextPage = () => {
    const next = page + 1;
    setPage(next);
    fetchExams(next, false);
  };

  const goPrevPage = () => {
    const prev = page - 1;
    setPage(prev);
    fetchExams(prev, false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const renderItem = ({ item }: { item: Examination }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/case/${item.id}`)}
      activeOpacity={0.8}
    >
      {item.status === 'Urgent' && (
        <View style={s.urgentStripe} />
      )}
      <View style={s.cardContent}>
        <ExamThumbnail photoUrl={item.photo_url} />
        <View style={s.cardLeft}>
          <Text style={s.patientId}>{item.patient_id}</Text>
          <Text style={s.dateText}>{formatDate(item.created_at)}</Text>
          <Text style={s.complaintText} numberOfLines={1}>{item.chief_complaint}</Text>
        </View>
        <View style={s.cardRight}>
          <StatusBadge status={item.status} />
          <ChevronRight color="#9ca3af" size={18} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#3A7CA5" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>History</Text>
          <Text style={s.headerSub}>{total} examination{total !== 1 ? 's' : ''} total</Text>
        </View>
        <TouchableOpacity style={s.newBtn} onPress={() => router.push('/(tabs)/new-exam')} activeOpacity={0.85}>
          <Camera color="#ffffff" size={16} />
          <Text style={s.newBtnText}>New Exam</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Clock color="#d1d5db" size={48} />
          <Text style={s.emptyTitle}>No examinations yet</Text>
          <Text style={s.emptySub}>Start your first examination using the button above.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3A7CA5" />}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={s.pagination}>
                <TouchableOpacity
                  style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                  onPress={goPrevPage}
                  disabled={page <= 1}
                >
                  <Text style={s.pageBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={s.pageInfo}>{page} / {totalPages}</Text>
                <TouchableOpacity
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  onPress={goNextPage}
                  disabled={page >= totalPages}
                >
                  <Text style={s.pageBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3A7CA5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  newBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
    flexDirection: 'row',
  },
  urgentStripe: { width: 4, backgroundColor: '#ef4444' },
  cardContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14,
    gap: 12,
  },
  thumbnail: { width: 54, height: 54, borderRadius: 10, backgroundColor: '#e5e7eb' },
  thumbnailFallback: {
    width: 54, height: 54, borderRadius: 10, backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  cardLeft: { flex: 1, gap: 3 },
  patientId: { fontSize: 14, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  dateText: { fontSize: 12, color: '#6b7280' },
  complaintText: { fontSize: 13, color: '#374151' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 20, paddingVertical: 20,
  },
  pageBtn: {
    backgroundColor: '#3A7CA5', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  pageBtnDisabled: { backgroundColor: '#e5e7eb' },
  pageBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  pageInfo: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
