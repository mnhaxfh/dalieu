import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Camera, Clock, Bell, Settings } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useEffect } from 'react';

function NotificationIcon({ color, size, unreadCount }: { color: any; size: number; unreadCount: number }) {
  return (
    <View>
      <Bell color={color} size={size} strokeWidth={2} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { token, unreadCount, refreshNotifications } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
    }
  }, [token]);

  useFocusEffect(() => {
    refreshNotifications();
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#3A7CA5',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="new-exam"
        options={{
          title: 'New Exam',
          tabBarIcon: ({ color, size }) => (
            <Camera color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Clock color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <NotificationIcon color={color} size={size} unreadCount={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});
