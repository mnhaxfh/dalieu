from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Literal

# Schema cơ sở chứa các trường chung
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Tên đăng nhập")
    full_name: str = Field(..., min_length=2, max_length=100, description="Họ và tên đầy đủ")
    role: Literal["worker", "doctor"] = Field(default="worker", description="Vai trò: worker (nhân viên y tế) hoặc doctor (bác sĩ)")

# Dữ liệu yêu cầu khi Đăng ký tài khoản mới
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72, description="Mật khẩu phải từ 8 đến 72 ký tự")

# Dữ liệu yêu cầu khi Đăng nhập
class UserLogin(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")

# Định dạng dữ liệu trả về cho Client (Giấu password để bảo mật)
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    # Cho phép Pydantic đọc dữ liệu trực tiếp từ SQLAlchemy Model (ORM)
    model_config = ConfigDict(from_attributes=True)

# Định dạng Token trả về khi đăng nhập thành công
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None