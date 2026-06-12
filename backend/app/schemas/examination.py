from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal

# Schema chứa dữ liệu gửi lên từ Mobile khi tạo ca khám mới (Bước nhập thông tin nhân khẩu học & bệnh lý)
class ExamCreate(BaseModel):
    age: int = Field(..., ge=0, le=120, description="Tuổi bệnh nhân (0 đến 120)")
    sex: Literal["Male", "Female", "Other"] = Field(..., description="Giới tính bệnh nhân")
    chief_complaint: str = Field(..., min_length=5, description="Lý do đến khám")

    # Vị trí tổn thương — cần thiết để AI model encode metadata 7-dim chính xác
    body_site: Optional[str] = Field(
        default="other",
        description="Vị trí tổn thương: 'face', 'neck', 'torso', 'arm', 'leg', 'other'"
    )

    # Tiếp nhận dữ liệu dạng Key-Value từ các ô checkbox bệnh lý kèm theo trên Mobile
    known_conditions: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Bệnh lý kèm theo dưới dạng JSON object (ví dụ: {'diabetes': true, 'hypertension': false})"
    )

# Dữ liệu bác sĩ gửi lên khi cập nhật nhận xét và trạng thái ca khám từ Web App
class ExamUpdate(BaseModel):
    status: Optional[Literal["Pending", "Under Review", "Completed", "Urgent"]] = None
    doctor_feedback: Optional[str] = Field(default=None, description="Nhận xét chuyên môn của bác sĩ")
    doctor_id: Optional[int] = None

# Định dạng dữ liệu ca khám đầy đủ trả về cho phía Client (Mobile App & Web App)
class ExamResponse(BaseModel):
    id: int
    patient_id: str
    photo_url: str
    age: int
    sex: str
    chief_complaint: str
    body_site: Optional[str] = None
    known_conditions: Optional[Dict[str, Any]] = None
    status: str
    doctor_feedback: Optional[str] = None
    worker_id: int
    doctor_id: Optional[int] = None

    # AI kết quả — nullable vì AI có thể chưa chạy hoặc lỗi
    heatmap_url:    Optional[str]       = None
    seg_mask_url:   Optional[str]       = None
    ai_predictions: Optional[List[Dict[str, Any]]] = None

    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ExamListResponse(BaseModel):
    items: list[ExamResponse]
    page: int
    page_size: int
    total: int