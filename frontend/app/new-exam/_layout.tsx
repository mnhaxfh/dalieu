import { Stack } from 'expo-router';

export default function NewExamLayout() {
  return (
    <Stack
      screenOptions={{
        // Tắt header mặc định của hệ thống để tránh bị đè giao diện
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="demographics" options={{ title: 'Thông tin bệnh nhân' }} />
      <Stack.Screen name="privacy" options={{ title: 'Quyền riêng tư' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp và Crop' }} />
      <Stack.Screen name="review" options={{ title: 'Xem lại & Gửi' }} />
    </Stack>
  );
}
