import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, BellOff, CheckCheck, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  examination_id: number | null;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function Notifications() {
  const router = useRouter();
  const { token, refreshNotifications } = useAuth();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.notifications.list(token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleTap = async (item: Notification) => {
    if (!token) return;
    // Mark as read then navigate
    if (!item.is_read) {
      try {
        await api.notifications.read(item.id, token);
        setItems(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        refreshNotifications();
      } catch (_) {}
    }
    if (item.examination_id != null) {
      router.push(`/case/${item.examination_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    setMarkingAll(true);
    try {
      await api.notifications.readAll(token);
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshNotifications();
    } catch (e) {
      console.error('Failed to mark all read:', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = items.filter(n => !n.is_read).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[s.card, !item.is_read && s.unreadCard]}
      onPress={() => handleTap(item)}
      activeOpacity={0.8}
    >
      {!item.is_read && <View style={s.unreadAccent} />}
      <View style={s.cardInner}>
        <View style={[s.iconWrap, !item.is_read ? s.iconWrapUnread : s.iconWrapRead]}>
          <Bell color={!item.is_read ? '#3A7CA5' : '#9ca3af'} size={18} />
        </View>
        <View style={s.textWrap}>
          <View style={s.titleRow}>
            <Text style={[s.title, !item.is_read && s.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={s.time}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={s.message} numberOfLines={2}>{item.message}</Text>
        </View>
        {item.examination_id != null && (
          <ChevronRight color="#9ca3af" size={16} />
        )}
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
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={s.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[s.markAllBtn, markingAll && s.btnDisabled]}
            onPress={handleMarkAllRead}
            disabled={markingAll}
            activeOpacity={0.8}
          >
            {markingAll
              ? <ActivityIndicator color="#3A7CA5" size="small" />
              : <>
                  <CheckCheck color="#3A7CA5" size={16} />
                  <Text style={s.markAllText}>Mark all read</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <BellOff color="#d1d5db" size={48} />
          <Text style={s.emptyTitle}>No notifications</Text>
          <Text style={s.emptySub}>You'll be notified when a doctor reviews your examinations.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3A7CA5" />
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
  headerSub: { fontSize: 13, color: '#3A7CA5', fontWeight: '500', marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, backgroundColor: '#eff6ff',
  },
  btnDisabled: { opacity: 0.5 },
  markAllText: { color: '#3A7CA5', fontSize: 13, fontWeight: '600' },
  list: { padding: 12, gap: 8 },

  card: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
    overflow: 'hidden', flexDirection: 'row',
    shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1,
  },
  unreadCard: { borderColor: '#bfdbfe', backgroundColor: '#f0f7ff' },
  unreadAccent: { width: 4, backgroundColor: '#3A7CA5' },
  cardInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  iconWrapUnread: { backgroundColor: '#dbeafe' },
  iconWrapRead: { backgroundColor: '#f3f4f6' },
  textWrap: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 14, color: '#374151', fontWeight: '500', flex: 1 },
  titleUnread: { color: '#111827', fontWeight: '700' },
  time: { fontSize: 11, color: '#9ca3af', flexShrink: 0 },
  message: { fontSize: 13, color: '#6b7280', lineHeight: 18 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});
