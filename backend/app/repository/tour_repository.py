from typing import Optional, Dict, List
from datetime import datetime

from app.repository.base_repository import BaseRepository
from app.core.database import get_database


class TourRepository(BaseRepository):
    """Repository cho Tour"""

    def __init__(self):
        db = get_database()
        super().__init__(db["tours"])

    async def create(self, data: Dict) -> Dict:
        """Tạo tour mới với timestamps"""
        data["created_at"] = datetime.utcnow()
        data["updated_at"] = datetime.utcnow()
        return await super().create(data)

    async def update(self, id: str, data: Dict) -> Optional[Dict]:
        """Cập nhật tour với timestamp"""
        data["updated_at"] = datetime.utcnow()
        return await super().update(id, data)

    async def find_by_name(self, name: str) -> Optional[Dict]:
        """Tìm tour theo tên"""
        return await self.find_one({"name": name})
