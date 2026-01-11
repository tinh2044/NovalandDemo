from typing import Dict, List
from fastapi import UploadFile

from app.services.base_service import BaseService
from app.repository.scene_repository import SceneRepository
from app.repository.hotspot_repository import HotspotRepository
from app.core.cloudinary_config import cloudinary_service
from app.core.exceptions import NotFoundError


class SceneService(BaseService):
    """Service cho Scene"""

    def __init__(self):
        self.repository = SceneRepository()
        self.hotspot_repository = HotspotRepository()

    async def get_scenes_by_tour(self, tour_id: str) -> List[Dict]:
        """Lấy tất cả scenes của một tour"""
        return await self.repository.find_by_tour_id(tour_id)

    async def get_scene_with_hotspots(self, scene_id: str) -> Dict:
        """Lấy scene kèm hotspots"""
        scene = await self.repository.find_by_id(scene_id)
        if not scene:
            raise NotFoundError(f"Scene not found: {scene_id}")

        hotspots = await self.hotspot_repository.find_by_scene_id(scene_id)
        scene["hotspots"] = hotspots
        return scene

    async def upload_image(self, file: UploadFile, tour_id: str) -> Dict:
        """
        Upload ảnh scene lên Cloudinary

        Returns:
            Dict với url và public_id
        """
        result = await cloudinary_service.upload_image(
            file,
            folder=f"novaland/scenes/{tour_id}",
        )
        return {
            "url": result["url"],
            "public_id": result["public_id"],
        }

    async def delete_image(self, public_id: str) -> bool:
        """Xóa ảnh scene trên Cloudinary"""
        try:
            return cloudinary_service.delete_image(public_id)
        except Exception:
            return False

    async def delete_scene_cascade(self, scene_id: str) -> bool:
        """Xóa scene và tất cả hotspots liên quan"""
        scene = await self.repository.find_by_id(scene_id)
        if not scene:
            raise NotFoundError(f"Scene not found: {scene_id}")

        # Xóa ảnh trên Cloudinary nếu có
        public_id = scene.get("image_public_id")
        if public_id:
            await self.delete_image(public_id)

        # Xóa hotspots
        await self.hotspot_repository.delete_by_scene_id(scene_id)

        # Xóa scene
        return await self.repository.delete(scene_id)
