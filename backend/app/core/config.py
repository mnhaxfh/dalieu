from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Khai báo các biến trùng tên với file .env để Pydantic tự động map dữ liệu
    DATABASE_URL: str
    
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Mặc định 24 tiếng
    
    UPLOAD_DIR: str = "static/uploads"

    STORAGE_BACKEND: str = "local"  # local | minio
    MINIO_ENDPOINT: str | None = None
    MINIO_ACCESS_KEY: str | None = None
    MINIO_SECRET_KEY: str | None = None
    MINIO_BUCKET: str = "dermscreen"
    MINIO_SECURE: bool = False
    MINIO_PUBLIC_URL: str | None = None

    # Cấu hình để Pydantic biết phải tìm đọc file .env ở đâu
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

# Khởi tạo một object settings dùng chung cho toàn bộ ứng dụng
settings = Settings()