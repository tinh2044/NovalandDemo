from typing import Optional, Dict, List

from app.repository.base_repository import BaseRepository
from app.core.database import get_database


class SceneRepository(BaseRepository):
    """Repository cho Scene"""

    def __init__(self):
        db = get_database()
        super().__init__(db["scenes"])

    async def find_by_tour_id(self, tour_id: str) -> List[Dict]:
        """Tìm tất cả scenes của một tour"""
        return await self.find_all({"tour_id": tour_id}, limit=100)

    async def delete_by_tour_id(self, tour_id: str) -> int:
        """Xóa tất cả scenes của một tour"""
        return await self.delete_many({"tour_id": tour_id})
