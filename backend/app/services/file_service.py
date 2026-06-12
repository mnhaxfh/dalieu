import os
import uuid
import shutil
from io import BytesIO
from fastapi import UploadFile
from minio import Minio

from app.core.config import settings

def get_minio_client() -> Minio | None:
    if settings.STORAGE_BACKEND == "minio":
        return Minio(
            settings.MINIO_ENDPOINT or "localhost:9000",
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
    return None

def get_public_url(filename: str) -> str:
    if settings.STORAGE_BACKEND == "minio":
        endpoint = settings.MINIO_PUBLIC_URL or f"http://{settings.MINIO_ENDPOINT or 'localhost:9000'}"
        return f"{endpoint}/{settings.MINIO_BUCKET}/{filename}"
    return f"/static/uploads/{filename}"

def save_upload_file(
    file: UploadFile,
    *,
    allowed_content_types: set[str],
    max_size_bytes: int,
) -> str:
    if file.content_type not in allowed_content_types:
        raise ValueError("Định dạng ảnh không hợp lệ.")

    ext = os.path.splitext(file.filename or "")[1]
    filename = f"{uuid.uuid4().hex}{ext}"

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_size_bytes:
        raise ValueError("Kích thước ảnh vượt quá giới hạn.")

    if settings.STORAGE_BACKEND == "minio":
        client = get_minio_client()
        if client:
            # Kiểm tra và tạo bucket nếu chưa tồn tại
            if not client.bucket_exists(settings.MINIO_BUCKET):
                client.make_bucket(settings.MINIO_BUCKET)
                # Set policy public cho bucket mới tạo
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                            "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}"],
                        },
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}/*"],
                        },
                    ],
                }
                import json
                client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))

            client.put_object(
                bucket_name=settings.MINIO_BUCKET,
                object_name=filename,
                data=file.file,
                length=size,
                content_type=file.content_type
            )
            return get_public_url(filename)

    # Fallback to local
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return get_public_url(filename)


def upload_bytes(data: bytes, filename: str, content_type: str = "image/png") -> str:
    """Utility function to upload raw bytes (like heatmap/segmask) to MinIO or Local"""
    if settings.STORAGE_BACKEND == "minio":
        client = get_minio_client()
        if client:
            stream = BytesIO(data)
            client.put_object(
                bucket_name=settings.MINIO_BUCKET,
                object_name=filename,
                data=stream,
                length=len(data),
                content_type=content_type
            )
            return get_public_url(filename)
    
    # Fallback to local
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(data)
    return get_public_url(filename)
