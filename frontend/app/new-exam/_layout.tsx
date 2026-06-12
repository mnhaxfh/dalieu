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
      <Stack.Screen name="capture" options={{ title: 'Chụp ảnh' }} />
      <Stack.Screen name="quality-check" options={{ title: 'Kiểm tra chất lượng' }} />
      <Stack.Screen name="mask" options={{ title: 'Che chắn thông tin' }} />
      <Stack.Screen name="crop" options={{ title: 'Cắt ảnh' }} />
      <Stack.Screen name="demographics" options={{ title: 'Thông tin bệnh nhân' }} />
      <Stack.Screen name="review" options={{ title: 'Xem lại' }} />
    </Stack>
  );
}
