import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, ShieldCheck, Zap } from 'lucide-react-native';

export default function NewExamIndex() {
  const router = useRouter();

  const startExam = () => {
    router.push('/new-exam/capture');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tạo Ca Khám Mới</Text>
        <Text style={styles.subtitle}>Quy trình khám da liễu hỗ trợ bởi AI</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.featureItem}>
          <View style={styles.iconCircle}>
            <Zap color="#3A7CA5" size={24} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Phân tích AI tức thì</Text>
            <Text style={styles.featureDesc}>Hỗ trợ chẩn đoán các bệnh lý về da phổ biến.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.iconCircle}>
            <ShieldCheck color="#28a745" size={24} />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Bảo mật dữ liệu</Text>
            <Text style={styles.featureDesc}>Ảnh được xóa EXIF và che chắn thông tin cá nhân.</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.startBtn} onPress={startExam}>
        <Camera color="#fff" size={24} />
        <Text style={styles.startBtnText}>Bắt đầu chụp ảnh</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>Vui lòng đảm bảo ánh sáng đầy đủ trước khi chụp.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  content: { marginBottom: 50 },
  featureItem: { flexDirection: 'row', marginBottom: 25, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f7ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  featureDesc: { fontSize: 14, color: '#777', marginTop: 2 },
  startBtn: {
    backgroundColor: '#3A7CA5',
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3A7CA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  footerNote: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 12 }
});
