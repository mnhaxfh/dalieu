# DermScreen API Contract (MVP)

Base URL:
- Local: http://127.0.0.1:8000/api

Auth:
- Use Bearer token in Authorization header for protected endpoints.
- Example: Authorization: Bearer <access_token>

Content types:
- JSON for most endpoints
- multipart/form-data for photo upload

## Auth

### POST /auth/register
Request (JSON):
```json
{
  "username": "demo",
  "full_name": "Demo User",
  "role": "worker",
  "password": "12345678"
}
```
Response (200):
```json
{
  "id": 1,
  "username": "demo",
  "full_name": "Demo User",
  "role": "worker",
  "is_active": true,
  "created_at": "2026-05-25T09:15:00Z"
}
```
Notes:
- password: min 8, max 72 chars.

### POST /auth/login
Request (x-www-form-urlencoded):
```
username=demo&password=12345678
```
Response (200):
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

### POST /auth/logout
Response (200):
```json
{ "message": "Dang xuat thanh cong." }
```

## Examinations

### POST /examinations
Request (multipart/form-data):
- age: number
- sex: Male | Female | Other
- chief_complaint: string
- known_conditions: JSON string (optional)
- photo: file (jpeg/png/webp, max 5MB)

Example known_conditions:
```json
{ "diabetes": "Type 2", "allergies": "penicillin" }
```

Response (201):
```json
{
  "id": 1,
  "patient_id": "DS-AB12CD34",
  "photo_url": "static/uploads/xxxxx.jpg",
  "age": 32,
  "sex": "Male",
  "chief_complaint": "Rash on arm",
  "known_conditions": {"diabetes": "Type 2"},
  "status": "Pending",
  "doctor_feedback": null,
  "worker_id": 1,
  "doctor_id": null,
  "created_at": "2026-05-25T09:15:00Z",
  "updated_at": null
}
```

### GET /examinations?page=1&page_size=10
Response (200):
```json
{
  "items": [
    {
      "id": 1,
      "patient_id": "DS-AB12CD34",
      "photo_url": "static/uploads/xxxxx.jpg",
      "age": 32,
      "sex": "Male",
      "chief_complaint": "Rash on arm",
      "known_conditions": {"diabetes": "Type 2"},
      "status": "Pending",
      "doctor_feedback": null,
      "worker_id": 1,
      "doctor_id": null,
      "created_at": "2026-05-25T09:15:00Z",
      "updated_at": null
    }
  ],
  "page": 1,
  "page_size": 10,
  "total": 21
}
```

### GET /examinations/{id}
Response (200): same as ExamResponse

### PUT /examinations/{id}
Role: doctor only
Request (JSON):
```json
{
  "status": "Completed",
  "doctor_feedback": "Likely eczema. Start topical steroid.",
  "doctor_id": 2
}
```
Response (200): updated ExamResponse
Notes:
- When status changes to Completed or Urgent, a notification is created for the worker.

### POST /examinations/{id}/urgent
Response (200): updated ExamResponse with status Urgent

## Notifications

### GET /notifications
Response (200):
```json
[
  {
    "id": 1,
    "title": "Cap nhat ca kham",
    "message": "Ca kham DS-AB12CD34 da chuyen sang trang thai Completed.",
    "is_read": false,
    "examination_id": 1,
    "created_at": "2026-05-25T10:20:00Z"
  }
]
```

### POST /notifications/read-all
Response (200):
```json
{ "updated": 3 }
```

### POST /notifications/{id}/read
Response (200): NotificationResponse

## Common Errors
- 401 Unauthorized: missing/invalid token
- 403 Forbidden: no permission
- 404 Not Found: resource missing
- 422 Unprocessable Entity: validation error
- 400 Bad Request: invalid input (e.g., bad JSON, image too large)
