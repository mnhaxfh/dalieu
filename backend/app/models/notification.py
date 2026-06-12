from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Người nhận thông báo (Có thể là Nhân viên y tế hoặc Bác sĩ)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    
    # Trạng thái đọc thông báo
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Liên kết trực tiếp đến ca khám để khi bấm vào thông báo app mobile nhảy ngay đến ca khám đó
    examination_id = Column(Integer, ForeignKey("examinations.id"), nullable=True)
    
    # Chỉ ghi nhận thời gian tạo, không có trường xóa mềm hay xóa cứng
    created_at = Column(DateTime(timezone=True), server_default=func.now())