# Novaland Tour Backend API

Backend FastAPI cho hệ thống 360° Virtual Tour.

## Tính năng

- CRUD cho Tours, Scenes, Hotspots
- Upload ảnh panorama lên Cloudinary
- Export tour JSON cho frontend
- MongoDB database

## Cài đặt

### 1. Tạo virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `env.example.txt`:

```bash
cp env.example.txt .env
```

Chỉnh sửa `.env` với thông tin của bạn:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=novaland_tour

# Cloudinary (đăng ký tại https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Khởi động server

```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Tours

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/tours` | Lấy danh sách tours |
| GET | `/api/v1/tours/{id}` | Lấy tour theo ID |
| GET | `/api/v1/tours/{id}/full` | Lấy tour đầy đủ với scenes & hotspots |
| GET | `/api/v1/tours/{id}/export` | Export tour JSON cho frontend |
| POST | `/api/v1/tours` | Tạo tour mới |
| PATCH | `/api/v1/tours/{id}` | Cập nhật tour |
| DELETE | `/api/v1/tours/{id}` | Xóa tour (cascade) |

### Scenes

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/scenes` | Lấy danh sách scenes |
| GET | `/api/v1/scenes/by-tour/{tour_id}` | Lấy scenes của tour |
| GET | `/api/v1/scenes/{id}` | Lấy scene theo ID |
| GET | `/api/v1/scenes/{id}/full` | Lấy scene với hotspots |
| POST | `/api/v1/scenes` | Tạo scene mới (có thể upload ảnh) |
| PATCH | `/api/v1/scenes/{id}` | Cập nhật scene (có thể thay ảnh) |
| DELETE | `/api/v1/scenes/{id}` | Xóa scene (cascade) |

### Hotspots

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/hotspots` | Lấy danh sách hotspots |
| GET | `/api/v1/hotspots/by-scene/{scene_id}` | Lấy hotspots của scene |
| GET | `/api/v1/hotspots/{id}` | Lấy hotspot theo ID |
| POST | `/api/v1/hotspots` | Tạo hotspot mới |
| POST | `/api/v1/hotspots/bulk` | Tạo nhiều hotspots |
| PATCH | `/api/v1/hotspots/{id}` | Cập nhật hotspot |
| PATCH | `/api/v1/hotspots/{id}/position` | Cập nhật vị trí |
| DELETE | `/api/v1/hotspots/{id}` | Xóa hotspot |

## Ví dụ sử dụng

### Tạo tour mới

```bash
curl -X POST http://localhost:8000/api/v1/tours \
  -H "Content-Type: application/json" \
  -d '{"name": "Novaland Resort Tour"}'
```

### Tạo scene

```bash
curl -X POST http://localhost:8000/api/v1/scenes \
  -H "Content-Type: application/json" \
  -d '{
    "tour_id": "TOUR_ID",
    "name": "Lobby",
    "description": "Khu vực sảnh",
    "initial_view": {"yaw": 0, "pitch": 0, "fov": 100}
  }'
```

### Tạo hotspot

```bash
curl -X POST http://localhost:8000/api/v1/hotspots \
  -H "Content-Type: application/json" \
  -d '{
    "scene_id": "SCENE_ID",
    "type": "click",
    "position": {"x": 100, "y": 0, "z": 300},
    "target_scene": "TARGET_SCENE_ID",
    "label": "Đi vào sảnh"
  }'
```

### Export tour JSON

```bash
curl http://localhost:8000/api/v1/tours/TOUR_ID/export
```

## Cấu trúc dự án

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── tour.py
│   │       │   ├── scene.py
│   │       │   └── hotspot.py
│   │       └── routes.py
│   ├── core/
│   │   ├── config.py        # Configurations
│   │   ├── database.py      # MongoDB connection
│   │   ├── cloudinary_config.py
│   │   └── exceptions.py
│   ├── repository/
│   │   ├── base_repository.py
│   │   ├── tour_repository.py
│   │   ├── scene_repository.py
│   │   └── hotspot_repository.py
│   ├── schema/
│   │   ├── base_schema.py
│   │   ├── tour_schema.py
│   │   ├── scene_schema.py
│   │   └── hotspot_schema.py
│   └── services/
│       ├── base_service.py
│       ├── tour_service.py
│       ├── scene_service.py
│       └── hotspot_service.py
├── requirements.txt
└── env.example.txt
```

## OpenAPI Documentation

Truy cập `/docs` để xem Swagger UI:
- http://localhost:8000/docs

Hoặc ReDoc:
- http://localhost:8000/redoc
