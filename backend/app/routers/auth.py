from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User  # Đảm bảo bạn đã import đúng User model từ file models của mình
from app.schemas import UserCreate, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.config import settings

# Khởi tạo router dành riêng cho xác thực hệ thống
router = APIRouter(
    prefix="/auth",
    tags=["Authentication (Xác thực)"]
)

# ==========================================
# 1. API ĐĂNG KÝ TÀI KHOẢN (REGISTER)
# ==========================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    API đăng ký tài khoản cho Nhân viên y tế (worker) hoặc Bác sĩ (doctor).
    - Kiểm tra username đã tồn tại chưa.
    - Băm mật khẩu (bcrypt) trước khi lưu.
    - Trả về thông tin user an toàn (không kèm password).
    """
    # Bước 1: Kiểm tra xem tên đăng nhập đã được sử dụng hay chưa
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập này đã tồn tại trên hệ thống DermScreen."
        )
    
    # Bước 2: Tạo đối tượng User mới và mã hóa mật khẩu thô
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=hashed_pwd,
        is_active=True  # Mặc định kích hoạt tài khoản
    )
    
    # Bước 3: Lưu vào Cơ sở dữ liệu
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


# ==========================================
# 2. API ĐĂNG NHẬP ĐỔI TOKEN (LOGIN)
# ==========================================
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    API Đăng nhập chuẩn mã nguồn mở OAuth2.
    - Nhận vào dữ liệu dạng form-data: `username` và `password`.
    - Kiểm tra tính hợp lệ của tài khoản.
    - Trả về Access Token (JWT) để Mobile/Web lưu lại phục vụ các request sau.
    """
    # Bước 1: Tìm người dùng trong Database dựa vào username người dùng gửi lên
    # (FastAPI OAuth2PasswordRequestForm map trường tên đăng nhập vào thuộc tính .username)
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # Bước 2: Xác thực sự tồn tại và kiểm tra mật khẩu đã băm
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Bước 3: Kiểm tra xem tài khoản có bị khóa hay không
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Tài khoản này đã bị tạm khóa."
        )
    
    # Bước 4: Tạo JSON Web Token (JWT) chứa thông tin định danh và vai trò
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "sub": user.username,
        "role": user.role
    }
    
    access_token = create_access_token(
        data=token_payload, 
        expires_delta=access_token_expires
    )
    
    # Bước 5: Trả về Token đúng định dạng cấu trúc mà Pydantic Token Schema yêu cầu
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }


# ==========================================
# 3. API ĐĂNG XUẤT (LOGOUT)
# ==========================================
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    API đăng xuất người dùng.
    Hiện tại dùng JWT stateless nên phía client chỉ cần xóa token.
    """
    return {
        "message": "Đăng xuất thành công."
    }