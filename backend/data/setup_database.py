"""
Script all-in-one để:
1. Upload ảnh scenes lên Cloudinary
2. Seed dữ liệu vào MongoDB

Chạy: python backend/data/setup_database.py
       python backend/data/setup_database.py --skip-upload  (bỏ qua upload, dùng URL có sẵn)
       python backend/data/setup_database.py --upload-only  (chỉ upload, không seed)
"""

import os
import sys
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timezone

MONGODB_URI = (
    "mongodb+srv://tinhdev:tinh23122004@novaland.rpfrsmx.mongodb.net/?appName=Novaland"
)
DATABASE_NAME = "novaland_tour"

CLOUDINARY_CLOUD_NAME = "dd3pxk4zr"
CLOUDINARY_API_KEY = "151113475398569"
CLOUDINARY_API_SECRET = "6QhIl4YW_Iwsu6I_V6AvmOi7hP0"


# Đường dẫn ảnh scenes
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "panoramas")

# Mapping file -> scene key
IMAGE_FILES = {
    "panorama-lobby.png": "lobby",
    "panorama-pool.png": "pool",
    "panorama-garden.png": "garden",
    "panorama-suite.png": "suite",
}

# URLs mặc định (local)
DEFAULT_URLS = {
    "lobby": "/panoramas/panorama-lobby.png",
    "pool": "/panoramas/panorama-pool.png",
    "garden": "/panoramas/panorama-garden.png",
    "suite": "/panoramas/panorama-suite.png",
}


def configure_cloudinary():
    """Cấu hình Cloudinary"""
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_image(file_path: str, public_id: str) -> dict:
    """Upload một ảnh scene lên Cloudinary"""
    print(f"   📤 Uploading: {os.path.basename(file_path)}...")

    result = cloudinary.uploader.upload(
        file_path,
        folder="novaland/scenes",
        public_id=public_id,
        resource_type="image",
        overwrite=True,
        quality="auto:best",
    )

    print(f"      ✅ Done: {result['secure_url']}")
    return {
        "public_id": result["public_id"],
        "url": result["secure_url"],
        "width": result["width"],
        "height": result["height"],
    }


def upload_all_images() -> dict:
    """Upload tất cả ảnh scenes lên Cloudinary"""
    configure_cloudinary()
    urls = {}

    print("\n" + "=" * 60)
    print("📷 BƯỚC 1: Upload ảnh Scenes lên Cloudinary")
    print("=" * 60)

    for filename, scene_key in IMAGE_FILES.items():
        file_path = os.path.join(IMAGES_DIR, filename)

        if not os.path.exists(file_path):
            print(f"   ❌ Không tìm thấy: {file_path}")
            urls[scene_key] = DEFAULT_URLS[scene_key]
            continue

        try:
            result = upload_image(file_path, scene_key)
            urls[scene_key] = result["url"]
        except Exception as e:
            print(f"   ❌ Lỗi upload {filename}: {e}")
            urls[scene_key] = DEFAULT_URLS[scene_key]

    return urls


def get_database():
    print("Đang kết nối MongoDB...")
    client = MongoClient(MONGODB_URI)
    # Test connection
    client.admin.command("ping")
    print("Kết nối thành công!")
    return client[DATABASE_NAME]


def seed_database(image_urls: dict):
    """Seed dữ liệu vào MongoDB"""
    db = get_database()

    print("\n" + "=" * 60)
    print("🗃️  BƯỚC 2: Seed dữ liệu vào MongoDB")
    print("=" * 60)

    # IDs cố định để dễ reference
    tour_id = ObjectId("6787a1b2c3d4e5f6a7b8c9d0")
    lobby_id = ObjectId("6787a1b2c3d4e5f6a7b8c9d1")
    pool_id = ObjectId("6787a1b2c3d4e5f6a7b8c9d2")
    garden_id = ObjectId("6787a1b2c3d4e5f6a7b8c9d3")
    suite_id = ObjectId("6787a1b2c3d4e5f6a7b8c9d4")

    # ========== TOURS ==========
    tours = [
        {
            "_id": tour_id,
            "name": "Tour Ảo Novaland Resort",
            "entry_scene": str(lobby_id),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
    ]

    # ========== SCENES ==========
    scenes = [
        {
            "_id": lobby_id,
            "tour_id": str(tour_id),
            "name": "Khu Ngoài Tòa Nhà",
            "description": "Không gian bên ngoài tòa tháp, với bãi cỏ rộng và tầm nhìn ra các tuyến đường xung quanh.",
            "image_url": image_urls.get("lobby", DEFAULT_URLS["lobby"]),
            "initial_view": {"yaw": 0, "pitch": 0, "fov": 100},
        },
        {
            "_id": pool_id,
            "tour_id": str(tour_id),
            "name": "Sảnh Trong Tòa Nhà",
            "description": "Khu sảnh nội khu với ghế nghỉ, cây xanh và không gian mở ngay chân tòa tháp.",
            "image_url": image_urls.get("pool", DEFAULT_URLS["pool"]),
            "initial_view": {"yaw": 0.5, "pitch": 0, "fov": 100},
        },
        {
            "_id": garden_id,
            "tour_id": str(tour_id),
            "name": "Đường Nội Khu",
            "description": "Tuyến đường nội khu lát đá và nhựa chạy quanh dự án, kết nối tới sảnh và không gian bên ngoài.",
            "image_url": image_urls.get("garden", DEFAULT_URLS["garden"]),
            "initial_view": {"yaw": 0, "pitch": 0, "fov": 100},
        },
        {
            "_id": suite_id,
            "tour_id": str(tour_id),
            "name": "Toàn Cảnh Từ Trên Cao",
            "description": "Ngắm nhìn toàn bộ khu đô thị Novaland từ trên cao: tòa tháp chính, cảnh quan và mặt nước.",
            "image_url": image_urls.get("suite", DEFAULT_URLS["suite"]),
            "initial_view": {"yaw": 0, "pitch": 0.5, "fov": 90},
        },
    ]

    # ========== HOTSPOTS ==========
    hotspots = [
        # Lobby hotspots
        {
            "scene_id": str(lobby_id),
            "type": "click",
            "position": {"x": -320, "y": 40, "z": 239},
            "target_scene": str(pool_id),
            "label": "Lối vào sảnh",
        },
        {
            "scene_id": str(lobby_id),
            "type": "click",
            "position": {"x": 145, "y": 0, "z": 373},
            "target_scene": str(garden_id),
            "label": "Đến đường nội khu",
        },
        {
            "scene_id": str(lobby_id),
            "type": "click",
            "position": {"x": -167, "y": -40, "z": -364},
            "target_scene": str(garden_id),
            "label": "Lối ra đường",
        },
        {
            "scene_id": str(lobby_id),
            "type": "click",
            "position": {"x": 0, "y": 118, "z": 382},
            "target_scene": str(suite_id),
            "label": "Toàn cảnh",
        },
        # Pool hotspots
        {
            "scene_id": str(pool_id),
            "type": "click",
            "position": {"x": -380, "y": 0, "z": 115},
            "target_scene": str(lobby_id),
            "label": "Ra khu ngoài tòa nhà",
        },
        {
            "scene_id": str(pool_id),
            "type": "click",
            "position": {"x": 351, "y": -40, "z": -192},
            "target_scene": str(lobby_id),
            "label": "Lối ra ngoài",
        },
        {
            "scene_id": str(pool_id),
            "type": "click",
            "position": {"x": 28, "y": 0, "z": -399},
            "target_scene": str(garden_id),
            "label": "Đến đường nội khu",
        },
        {
            "scene_id": str(pool_id),
            "type": "click",
            "position": {"x": 216, "y": 40, "z": 336},
            "target_scene": str(garden_id),
            "label": "Lối ra đường →",
        },
        {
            "scene_id": str(pool_id),
            "type": "click",
            "position": {"x": 0, "y": 118, "z": 382},
            "target_scene": str(suite_id),
            "label": "Toàn cảnh từ trên cao",
        },
        # Garden hotspots
        {
            "scene_id": str(garden_id),
            "type": "click",
            "position": {"x": -320, "y": 0, "z": 240},
            "target_scene": str(lobby_id),
            "label": "Đến khu ngoài tòa nhà",
        },
        {
            "scene_id": str(garden_id),
            "type": "click",
            "position": {"x": 336, "y": -40, "z": -216},
            "target_scene": str(lobby_id),
            "label": "Tòa nhà chính →",
        },
        {
            "scene_id": str(garden_id),
            "type": "click",
            "position": {"x": 351, "y": 0, "z": -192},
            "target_scene": str(pool_id),
            "label": "Đến sảnh trong tòa nhà",
        },
        {
            "scene_id": str(garden_id),
            "type": "click",
            "position": {"x": -78, "y": 40, "z": 392},
            "target_scene": str(pool_id),
            "label": "Sảnh trong →",
        },
        {
            "scene_id": str(garden_id),
            "type": "click",
            "position": {"x": 0, "y": 100, "z": 387},
            "target_scene": str(suite_id),
            "label": "Toàn cảnh từ trên cao",
        },
        # Suite hotspots
        {
            "scene_id": str(suite_id),
            "type": "click",
            "position": {"x": -100, "y": -280, "z": 260},
            "target_scene": str(lobby_id),
            "label": "Xuống khu ngoài tòa nhà",
        },
        {
            "scene_id": str(suite_id),
            "type": "click",
            "position": {"x": 0, "y": -300, "z": 265},
            "target_scene": str(pool_id),
            "label": "Xuống sảnh trong tòa nhà",
        },
        {
            "scene_id": str(suite_id),
            "type": "click",
            "position": {"x": 100, "y": -280, "z": 260},
            "target_scene": str(garden_id),
            "label": "Xuống đường nội khu",
        },
    ]

    # ========== INSERT DATA ==========
    print("   🗑️  Xóa dữ liệu cũ...")
    db.tours.delete_many({})
    db.scenes.delete_many({})
    db.hotspots.delete_many({})

    result = db.tours.insert_many(tours)
    print(f"   ✅ Đã thêm {len(result.inserted_ids)} tours")

    result = db.scenes.insert_many(scenes)
    print(f"   ✅ Đã thêm {len(result.inserted_ids)} scenes")

    result = db.hotspots.insert_many(hotspots)
    print(f"   ✅ Đã thêm {len(result.inserted_ids)} hotspots")

    return {
        "tour_id": str(tour_id),
        "scene_ids": {
            "lobby": str(lobby_id),
            "pool": str(pool_id),
            "garden": str(garden_id),
            "suite": str(suite_id),
        },
    }


def verify_data():
    """Kiểm tra dữ liệu đã seed"""
    db = get_database()

    print("\n" + "=" * 60)
    print("📊 THỐNG KÊ")
    print("=" * 60)
    print(f"   Tours:    {db.tours.count_documents({})}")
    print(f"   Scenes:   {db.scenes.count_documents({})}")
    print(f"   Hotspots: {db.hotspots.count_documents({})}")


def print_summary(urls: dict, ids: dict):
    """In tóm tắt kết quả"""
    print("\n" + "=" * 60)
    print("🎉 HOÀN TẤT!")
    print("=" * 60)

    print("\n📋 Scene Image URLs:")
    for key, url in urls.items():
        status = "☁️" if "cloudinary" in url else "💾"
        print(f"   {status} {key}: {url[:60]}...")

    print(f"\n🆔 Tour ID: {ids['tour_id']}")
    print("\n🆔 Scene IDs:")
    for key, id in ids["scene_ids"].items():
        print(f"   {key}: {id}")


def main():
    args = sys.argv[1:]

    skip_upload = "--skip-upload" in args
    upload_only = "--upload-only" in args

    print("\n" + "=" * 60)
    print("🚀 NOVALAND TOUR - DATABASE SETUP")
    print("=" * 60)

    # Step 1: Upload images
    if upload_only or not skip_upload:
        image_urls = upload_all_images()
    else:
        print("\n⏭️  Bỏ qua upload, sử dụng URLs local...")
        image_urls = DEFAULT_URLS.copy()

    if upload_only:
        print("\n📋 Cloudinary URLs:")
        for key, url in image_urls.items():
            print(f"   {key}: {url}")
        print("\n✅ Upload hoàn tất!")
        return

    # Step 2: Seed database
    ids = seed_database(image_urls)

    # Step 3: Verify
    verify_data()

    # Summary
    print_summary(image_urls, ids)


if __name__ == "__main__":
    main()
