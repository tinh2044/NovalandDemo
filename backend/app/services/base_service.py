from typing import Any, Dict, List, Optional

from app.repository.base_repository import BaseRepository


class BaseService:
    """Base service class"""

    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_list(
        self,
        filter_dict: Optional[Dict] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict:
        """Lấy danh sách với phân trang"""
        skip = (page - 1) * page_size
        items = await self.repository.find_all(
            filter_dict=filter_dict,
            skip=skip,
            limit=page_size
        )
        total_count = await self.repository.count(filter_dict)
        
        return {
            "items": items,
            "search_options": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count
            }
        }

    async def get_by_id(self, id: str) -> Optional[Dict]:
        """Lấy theo ID"""
        return await self.repository.find_by_id(id)

    async def create(self, data: Dict) -> Dict:
        """Tạo mới"""
        return await self.repository.create(data)

    async def update(self, id: str, data: Dict) -> Optional[Dict]:
        """Cập nhật"""
        return await self.repository.update(id, data)

    async def delete(self, id: str) -> bool:
        """Xóa"""
        return await self.repository.delete(id)
