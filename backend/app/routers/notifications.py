from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification, User
from app.schemas import NotificationResponse
from app.core.dependencies import get_current_user


router = APIRouter(
	prefix="/notifications",
	tags=["Notifications"]
)


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	return (
		db.query(Notification)
		.filter(Notification.user_id == current_user.id)
		.order_by(Notification.created_at.desc())
		.all()
	)


@router.post("/read-all")
def mark_all_notifications_read(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	updated = (
		db.query(Notification)
		.filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
		.update({"is_read": True}, synchronize_session=False)
	)
	db.commit()
	return {"updated": updated}


@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
	notification_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	notification = (
		db.query(Notification)
		.filter(Notification.id == notification_id)
		.first()
	)

	if not notification:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy thông báo.",
		)

	if notification.user_id != current_user.id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền truy cập thông báo này.",
		)

	notification.is_read = True
	db.commit()
	db.refresh(notification)
	return notification
