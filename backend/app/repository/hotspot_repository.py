from typing import Optional, Dict, List

from app.repository.base_repository import BaseRepository
from app.core.database import get_database


class HotspotRepository(BaseRepository):
    """Repository cho Hotspot"""

    def __init__(self):
        db = get_database()
        super().__init__(db["hotspots"])

    async def find_by_scene_id(self, scene_id: str) -> List[Dict]:
        """Tìm tất cả hotspots của một scene"""
        return await self.find_all({"scene_id": scene_id}, limit=100)

    async def delete_by_scene_id(self, scene_id: str) -> int:
        """Xóa tất cả hotspots của một scene"""
        return await self.delete_many({"scene_id": scene_id})

    async def delete_by_tour_id(self, tour_id: str) -> int:
        """Xóa tất cả hotspots của một tour (thông qua scene_ids)"""
        # Lấy tất cả scene_ids của tour
        from app.repository.scene_repository import SceneRepository
        scene_repo = SceneRepository()
        scenes = await scene_repo.find_by_tour_id(tour_id)
        
        total_deleted = 0
        for scene in scenes:
            deleted = await self.delete_by_scene_id(scene["_id"])
            total_deleted += deleted
        
        return total_deleted
