from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import Optional
import json

from app.services.scene_service import SceneService
from app.schema.scene_schema import (
    SceneResponse,
    SceneWithHotspots,
    FindSceneResult,
)
from app.schema.base_schema import MessageResponse

router = APIRouter(prefix="/scenes", tags=["scenes"])

scene_service = SceneService()


@router.get("", response_model=FindSceneResult)
async def get_scenes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tour_id: Optional[str] = None,
):
    """Lấy danh sách scenes"""
    filter_dict = {}
    if tour_id:
        filter_dict["tour_id"] = tour_id

    result = await scene_service.get_list(filter_dict, page, page_size)
    
    # Convert _id -> id cho response
    result["items"] = [
        SceneResponse(id=item["_id"], **{k: v for k, v in item.items() if k != "_id"})
        for item in result["items"]
    ]
    return result


@router.get("/by-tour/{tour_id}")
async def get_scenes_by_tour(tour_id: str):
    """Lấy tất cả scenes của một tour"""
    scenes = await scene_service.get_scenes_by_tour(tour_id)
    # Convert _id -> id cho response
    items = [
        SceneResponse(id=s["_id"], **{k: v for k, v in s.items() if k != "_id"})
        for s in scenes
    ]
    return {"items": items, "total": len(items)}


@router.get("/{scene_id}", response_model=SceneResponse)
async def get_scene(scene_id: str):
    """Lấy thông tin scene theo ID"""
    scene = await scene_service.get_by_id(scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return SceneResponse(
        id=scene["_id"], **{k: v for k, v in scene.items() if k != "_id"}
    )


@router.get("/{scene_id}/full", response_model=SceneWithHotspots)
async def get_scene_full(scene_id: str):
    """Lấy scene đầy đủ với hotspots"""
    scene = await scene_service.get_scene_with_hotspots(scene_id)
    return scene


@router.post("", response_model=SceneResponse)
async def create_scene(
    tour_id: str = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    initial_view: Optional[str] = Form(
        None
    ),  # JSON string: {"yaw": 0, "pitch": 0, "fov": 100}
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
):
    """
    Tạo scene mới

    - **tour_id**: ID của tour chứa scene
    - **name**: Tên scene
    - **description**: Mô tả (optional)
    - **initial_view**: JSON string góc nhìn ban đầu, ví dụ: {"yaw": 0, "pitch": 0, "fov": 100}
    - **image**: File ảnh 360° (optional)
    - **image_url**: URL ảnh 360° nếu đã có sẵn (optional)

    Lưu ý: Chỉ cần một trong hai: image (file) hoặc image_url
    """
    # Parse initial_view từ JSON string
    view_dict = {"yaw": 0, "pitch": 0, "fov": 100}
    if initial_view:
        try:
            view_dict = json.loads(initial_view)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="initial_view must be valid JSON"
            )

    scene_data = {
        "tour_id": tour_id,
        "name": name,
        "description": description,
        "initial_view": view_dict,
        "image_url": image_url,
    }

    # Upload ảnh nếu có file
    if image and image.filename:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        upload_result = await scene_service.upload_image(image, tour_id)
        scene_data["image_url"] = upload_result["url"]
        scene_data["image_public_id"] = upload_result["public_id"]

    result = await scene_service.create(scene_data)
    return SceneResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.patch("/{scene_id}", response_model=SceneResponse)
async def update_scene(
    scene_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    initial_view: Optional[str] = Form(None),  # JSON string
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
):
    """
    Cập nhật scene

    - **name**: Tên scene mới (optional)
    - **description**: Mô tả mới (optional)
    - **initial_view**: JSON string góc nhìn mới (optional)
    - **image**: File ảnh 360° mới (optional)
    - **image_url**: URL ảnh 360° mới (optional)
    """
    scene_data = {}

    if name is not None:
        scene_data["name"] = name
    if description is not None:
        scene_data["description"] = description
    if image_url is not None:
        scene_data["image_url"] = image_url

    if initial_view:
        try:
            scene_data["initial_view"] = json.loads(initial_view)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400, detail="initial_view must be valid JSON"
            )

    # Upload ảnh mới nếu có
    if image and image.filename:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Lấy scene hiện tại để có tour_id và xóa ảnh cũ
        current_scene = await scene_service.get_by_id(scene_id)
        if not current_scene:
            raise HTTPException(status_code=404, detail="Scene not found")

        # Xóa ảnh cũ trên Cloudinary
        old_public_id = current_scene.get("image_public_id")
        if old_public_id:
            await scene_service.delete_image(old_public_id)

        # Upload ảnh mới
        upload_result = await scene_service.upload_image(
            image, current_scene.get("tour_id", "default")
        )
        scene_data["image_url"] = upload_result["url"]
        scene_data["image_public_id"] = upload_result["public_id"]

    if not scene_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await scene_service.update(scene_id, scene_data)
    if not result:
        raise HTTPException(status_code=404, detail="Scene not found")
    return SceneResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.delete("/{scene_id}", response_model=MessageResponse)
async def delete_scene(scene_id: str):
    """Xóa scene và tất cả hotspots liên quan"""
    await scene_service.delete_scene_cascade(scene_id)
    return MessageResponse(message="Scene deleted successfully")
