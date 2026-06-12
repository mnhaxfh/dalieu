import uuid
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.database import Base

def generate_patient_id():
    # Tự động sinh mã ID ngẫu nhiên không trùng lặp, ví dụ: DS-A1B2C3D4
    return f"DS-{uuid.uuid4().hex[:8].upper()}"

class Examination(Base):
    __tablename__ = "examinations"

    # Khóa chính của bảng ghi hệ thống
    id = Column(Integer, primary_key=True, index=True)
    
    # Mã ID bệnh nhân tự sinh, khóa cứng và không cho chỉnh sửa tự ý từ phía Client
    patient_id = Column(String, unique=True, index=True, default=generate_patient_id, nullable=False)
    
    # Dữ liệu hình ảnh tổn thương da (Lưu đường dẫn URL hoặc Path tới thư mục static/uploads)
    photo_url = Column(String, nullable=False)
    
    # Thông tin nhân khẩu học và bệnh lý của bệnh nhân
    age = Column(Integer, nullable=False)
    sex = Column(String, nullable=False) # "Male", "Female", "Other"
    chief_complaint = Column(String, nullable=False) # Lý do khám
    
    # Vị trí tổn thương trên cơ thể — dùng để encode metadata 7-dim cho AI model
    # Ví dụ: "face", "neck", "torso", "arm", "leg", "other"
    body_site = Column(String, nullable=True, default="other")
    
    # Lưu trữ danh sách lựa chọn tích chọn dạng JSON, ví dụ: {"diabetes": "Type 2", "hypertension": "Stage 1"}
    known_conditions = Column(JSON, nullable=True)
    
    # Trạng thái ca khám: "Pending", "Under Review", "Completed", "Urgent"
    status = Column(String, default="Pending", nullable=False)
    
    # Nhận xét chuyên môn từ bác sĩ tuyến trên
    doctor_feedback = Column(String, nullable=True)

    # ── AI Classification Results ──────────────────────────────────────────
    # URL ảnh heatmap GradCAM (upload lên static/uploads sau khi AI chạy xong)
    heatmap_url = Column(String, nullable=True)
    
    # URL ảnh segmentation mask từ U-Net decoder (lesion region)
    seg_mask_url = Column(String, nullable=True)
    
    # Kết quả phân loại AI dạng JSON: [{"disease": "BCC", "full_name": "Basal Cell Carcinoma", "probability": 0.95}, ...]
    ai_predictions = Column(JSON, nullable=True)
    # ──────────────────────────────────────────────────────────────────────
    
    # Khóa ngoại liên kết tới người tạo ca khám (Nhân viên y tế)
    worker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Khóa ngoại liên kết tới bác sĩ phụ trách duyệt (Nếu có)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())