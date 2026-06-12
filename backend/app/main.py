from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import Base # Import Base đã gom đủ 3 models ở trên
from app.routers import auth
from app.routers import examinations, notifications
# Lệnh tự động tạo file CSDL sinh ra các bảng dữ liệu nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DermScreen API Hệ Thống Da Liễu",
    description="Backend API phục vụ ứng dụng Mobile và Web App Doctor cho dự án DermScreen",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cấu hình CORS để cho phép App Mobile (React Native/Expo) và Web kết nối tới
app.add_middleware(
    CORSMiddleware,
    # Cho phép Expo web / localhost dev access tới API trong môi trường phát triển.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Nhungs router xac thuc vao he thong API tong voi tien so /api
app.include_router(auth.router, prefix="/api")
app.include_router(examinations.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Chào mừng bạn đến với hệ thống API DermScreen!"}