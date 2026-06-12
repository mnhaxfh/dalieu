## API Contract

See [docs/api-contract.md](docs/api-contract.md).


## Các file “schema DB” và “API” nằm ở đây:

Schema DB (SQLAlchemy models): app/models/user.py, app/models/examination.py, app/models/notification.py


Cấu hình DB/base: app/database.py


Schema API (Pydantic): app/schemas/user.py, app/schemas/examination.py, app/schemas/notification.py


API routers (endpoint): app/routers/auth.py, app/routers/examinations.py, app/routers/notifications.py, app/routers/debs.py


Tài liệu API contract: docs/api-contract.md