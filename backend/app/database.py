from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# 1. Khởi tạo Engine kết nối CSDL
# Nếu là SQLite, cần thêm cấu hình "check_same_thread": False để FastAPI xử lý đa luồng async mượt mà
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(settings.DATABASE_URL)

# 2. Tạo một SessionLocal factory - Nơi cung cấp các phiên làm việc (session) với DB cho mỗi Request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. Tạo Base Class để các Database Models (bảng dữ liệu) sau này kế thừa
Base = declarative_base()

# 4. Hàm Dependency cung cấp Session DB cho các API Router (Sẽ giải phóng bộ nhớ tự động sau khi xong request)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()