from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    examination_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
