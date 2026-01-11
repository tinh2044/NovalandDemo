from typing import Dict, Optional, List

from app.services.base_service import BaseService
from app.repository.hotspot_repository import HotspotRepository
from app.core.exceptions import NotFoundError


class HotspotService(BaseService):
    """Service cho Hotspot"""

    def __init__(self):
        self.repository = HotspotRepository()

    async def get_hotspots_by_scene(self, scene_id: str) -> List[Dict]:
        """Lấy tất cả hotspots của một scene"""
        return await self.repository.find_by_scene_id(scene_id)

    async def create_hotspot(self, data: Dict) -> Dict:
        """Tạo hotspot mới"""
        # Validate required fields
        required_fields = ["scene_id", "position", "target_scene", "label"]
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Set default type if not provided
        if "type" not in data:
            data["type"] = "click"
        
        return await self.repository.create(data)

    async def update_hotspot_position(self, hotspot_id: str, position: Dict) -> Dict:
        """Cập nhật vị trí hotspot"""
        return await self.repository.update(hotspot_id, {"position": position})

    async def bulk_create(self, hotspots: List[Dict]) -> List[Dict]:
        """Tạo nhiều hotspots cùng lúc"""
        results = []
        for hotspot_data in hotspots:
            result = await self.create_hotspot(hotspot_data)
            results.append(result)
        return results

    async def bulk_delete_by_scene(self, scene_id: str) -> int:
        """Xóa tất cả hotspots của một scene"""
        return await self.repository.delete_by_scene_id(scene_id)
