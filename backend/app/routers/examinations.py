import json
import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Examination, User
from app.schemas import ExamResponse, ExamListResponse, ExamUpdate
from app.core.dependencies import get_current_user
from app.services.file_service import save_upload_file, upload_bytes
from app.models import Notification
from app.core.config import settings

import logging
logger = logging.getLogger(__name__)

# Lazy import the DermPredictor so the backend can start even when
# heavy AI dependencies (numpy/torch) are not installed in the container.
derm_predictor = None
try:
	from app.skin_model.predictor import DermPredictor
	try:
		derm_predictor = DermPredictor("app/skin_model/checkpoints/best_model.pth")
	except Exception as e:
		logger.warning(f"Could not initialize DermPredictor: {e}")
except Exception as e:
	logger.warning(f"Optional AI predictor not available: {e}")


router = APIRouter(
	prefix="/examinations",
	tags=["Examinations"]
)


def _normalize_photo_url(photo_url: str, upload_files: set[str] | None = None) -> str:
	if not photo_url:
		return photo_url

	clean = photo_url.replace("\\", "/")
	filename = clean.split("/")[-1]
	filename = re.sub(r"^[^0-9a-fA-F]+", "", filename)
	if not filename:
		return photo_url

	if settings.STORAGE_BACKEND == "minio":
		return f"/media/{filename}"

	if upload_files is None:
		try:
			upload_files = set(os.listdir(settings.UPLOAD_DIR))
		except FileNotFoundError:
			upload_files = set()

	if filename in upload_files:
		return f"/static/uploads/{filename}"

	# Try suffix match for corrupted names.
	matches = [name for name in upload_files if name.endswith(filename)]
	if len(matches) == 1:
		return f"/static/uploads/{matches[0]}"

	return photo_url


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_examination(
	age: int = Form(...),
	sex: str = Form(...),
	chief_complaint: str = Form(...),
	body_site: str = Form("other"),
	known_conditions: Optional[str] = Form(None),
	photo: UploadFile = File(...),
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	conditions_payload = None
	if known_conditions:
		try:
			conditions_payload = json.loads(known_conditions)
		except json.JSONDecodeError:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="known_conditions phải là JSON hợp lệ.",
			)

	try:
		photo_url = save_upload_file(
			photo,
			allowed_content_types={"image/jpeg", "image/png", "image/webp"},
			max_size_bytes=5 * 1024 * 1024,
		)
	except ValueError as exc:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=str(exc),
		)

	new_exam = Examination(
		photo_url=photo_url,
		age=age,
		sex=sex,
		chief_complaint=chief_complaint,
		body_site=body_site,
		known_conditions=conditions_payload,
		worker_id=current_user.id,
		status="Pending",
	)

	# Tạm thời ngắt kết nối với Skin Model (AI Prediction) theo yêu cầu
	# if derm_predictor:
	# 	try:
	# 		photo.file.seek(0)
	# 		img_bytes = photo.file.read()
	# 		
	# 		ai_res = derm_predictor.predict(
	# 			image_source=img_bytes,
	# 			age=age,
	# 			sex=sex,
	# 			body_site=body_site
	# 		)
	# 		
	# 		import uuid
	# 		heatmap_filename = f"{uuid.uuid4().hex}_heatmap.png"
	# 		seg_mask_filename = f"{uuid.uuid4().hex}_segmask.png"
	# 		
	# 		new_exam.heatmap_url = upload_bytes(ai_res['heatmap_png'], heatmap_filename)
	# 		new_exam.seg_mask_url = upload_bytes(ai_res['seg_mask_png'], seg_mask_filename)
	# 		
	# 		preds = []
	# 		from app.skin_model.predictor import CLASS_FULL
	# 		for d_code, p_val in ai_res['probabilities'].items():
	# 			preds.append({
	# 				"disease": d_code,
	# 				"full_name": CLASS_FULL.get(d_code, d_code),
	# 				"probability": p_val
	# 			})
	# 		# Sắp xếp theo xác suất giảm dần
	# 		preds.sort(key=lambda x: x["probability"], reverse=True)
	# 		new_exam.ai_predictions = preds
	# 	except Exception as e:
	# 		logger.error(f"AI Prediction Error: {e}")

	db.add(new_exam)
	db.commit()
	db.refresh(new_exam)
	return new_exam


@router.get("", response_model=ExamListResponse)
def list_examinations(
	page: int = 1,
	page_size: int = 10,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	if page < 1 or page_size < 1:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="page và page_size phải lớn hơn 0.",
		)

	offset = (page - 1) * page_size
	total = (
		db.query(Examination)
		.filter(Examination.worker_id == current_user.id)
		.count()
	)

	exams = (
		db.query(Examination)
		.filter(Examination.worker_id == current_user.id)
		.order_by(Examination.created_at.desc())
		.offset(offset)
		.limit(page_size)
		.all()
	)

	try:
		upload_files = set(os.listdir(settings.UPLOAD_DIR))
	except FileNotFoundError:
		upload_files = set()
	for exam in exams:
		exam.photo_url = _normalize_photo_url(exam.photo_url, upload_files)

	return {
		"items": exams,
		"page": page,
		"page_size": page_size,
		"total": total,
	}


@router.get("/{exam_id}", response_model=ExamResponse)
def get_examination(
	exam_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	exam = db.query(Examination).filter(Examination.id == exam_id).first()
	if not exam:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy ca khám.",
		)

	if exam.worker_id != current_user.id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền truy cập ca khám này.",
		)

	exam.photo_url = _normalize_photo_url(exam.photo_url)

	return exam


@router.post("/{exam_id}/urgent", response_model=ExamResponse)
def mark_examination_urgent(
	exam_id: int,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	exam = db.query(Examination).filter(Examination.id == exam_id).first()
	if not exam:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy ca khám.",
		)

	if exam.worker_id != current_user.id:
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Bạn không có quyền thao tác ca khám này.",
		)

	exam.status = "Urgent"
	db.commit()
	db.refresh(exam)
	return exam


@router.put("/{exam_id}", response_model=ExamResponse)
def update_examination_review(
	exam_id: int,
	payload: ExamUpdate,
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
):
	if current_user.role != "doctor":
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Chỉ bác sĩ mới được cập nhật trạng thái ca khám.",
		)

	exam = db.query(Examination).filter(Examination.id == exam_id).first()
	if not exam:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Không tìm thấy ca khám.",
		)

	previous_status = exam.status
	if payload.status is not None:
		exam.status = payload.status
	if payload.doctor_feedback is not None:
		exam.doctor_feedback = payload.doctor_feedback
	if payload.doctor_id is not None:
		exam.doctor_id = payload.doctor_id

	db.commit()
	db.refresh(exam)

	if exam.status in {"Completed", "Urgent"} and exam.status != previous_status:
		notification = Notification(
			user_id=exam.worker_id,
			title="Cập nhật ca khám",
			message=f"Ca khám {exam.patient_id} đã chuyển sang trạng thái {exam.status}.",
			examination_id=exam.id,
			is_read=False,
		)
		db.add(notification)
		db.commit()

	return exam
