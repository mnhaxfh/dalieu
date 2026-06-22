import os

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from app.database import engine
from app.models import Base # Import Base đã gom đủ 3 models ở trên
from app.routers import auth
from app.routers import examinations, notifications
from app.core.config import settings
from app.services.file_service import get_minio_client
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
#     allow_origin_regex=(
#         r"https?://("
#         r"localhost|"
#         r"127\.0\.0\.1|"
#         r"192\.168\.\d+\.\d+|"
#         r"[\w-]+\.loca\.lt"
#         r")(:\d+)?"
#     ),
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Nhungs router xac thuc vao he thong API tong voi tien so /api
app.include_router(auth.router, prefix="/api")
app.include_router(examinations.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/media/{filename}")
def read_media(filename: str):
    safe_filename = os.path.basename(filename)
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    if settings.STORAGE_BACKEND == "minio":
        client = get_minio_client()
        if not client:
            raise HTTPException(status_code=503, detail="Storage backend is unavailable.")

        try:
            obj = client.get_object(settings.MINIO_BUCKET, safe_filename)
        except Exception:
            raise HTTPException(status_code=404, detail="File not found.")

        def iter_object():
            try:
                for chunk in obj.stream(32 * 1024):
                    yield chunk
            finally:
                obj.close()
                obj.release_conn()

        return StreamingResponse(
            iter_object(),
            media_type=obj.headers.get("content-type", "application/octet-stream"),
        )

    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Chào mừng bạn đến với hệ thống API DermScreen!"}
