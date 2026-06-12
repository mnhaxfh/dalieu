from app.database import Base
from app.models.user import User
from app.models.examination import Examination
from app.models.notification import Notification

# Xuất Base ra để file main.py có thể gọi tạo bảng tự động dễ dàng
__all__ = ["Base", "User", "Examination", "Notification"]