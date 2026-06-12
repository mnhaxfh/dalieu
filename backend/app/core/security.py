from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from passlib.context import CryptContext
from app.core.config import settings

# 1. Khởi tạo Context để quản lý băm mật khẩu bằng Bcrypt
# Thư viện passlib tự động xử lý thêm chuỗi muối ngẫu nhiên (Salt) để chống tấn công vét cạn (Brute-force)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# LOGIC XỬ LÝ MẬT KHẨU (PASSWORD HASHING)
# ==========================================

def hash_password(password: str) -> str:
    """
    Nhận vào mật khẩu dạng chữ thô (Plain text) từ client và trả về chuỗi đã băm bảo mật.
    Dùng khi nhân viên y tế hoặc bác sĩ đăng ký tài khoản mới.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    So sánh mật khẩu thô người dùng vừa nhập với chuỗi mật khẩu đã mã hóa lưu trong Database.
    Trả về True nếu trùng khớp, False nếu sai mật khẩu.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ==========================================
# LOGIC XỬ LÝ TOKEN XÁC THỰC (JWT TOKENS)
# ==========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Tạo ra một chuỗi Access Token (JWT) mã hóa chứa thông tin định danh của người dùng.
    Gửi về cho Mobile / Web App để lưu lại và đính kèm vào Header trong các request sau.
    """
    to_encode = data.copy()
    
    # Tính toán thời gian hết hạn của Token
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Nếu không truyền vào, mặc định lấy cấu hình từ file .env (ví dụ: 1440 phút = 24 tiếng)
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Đăng ký trường thời gian hết hạn chuẩn JWT (exp)
    to_encode.update({"exp": expire})
    
    # Thực hiện ký số và mã hóa chuỗi JWT bằng Secret Key bảo mật
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Giải mã một chuỗi JWT ngược lại thành Data Dictionary nguyên bản.
    Dùng để kiểm tra xem Token gửi lên từ thiết bị di động có hợp lệ và còn hạn hay không.
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        # Trả về None nếu Token bị sửa đổi, giả mạo hoặc đã hết hạn sử dụng
        return None