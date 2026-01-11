from typing import Any, Dict, List, Optional, TypeVar
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from app.core.exceptions import NotFoundError

T = TypeVar("T")


class BaseRepository:
    """Base repository cho MongoDB operations"""

    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def find_all(
        self,
        filter_dict: Optional[Dict] = None,
        skip: int = 0,
        limit: int = 20,
        sort: Optional[List] = None
    ) -> List[Dict]:
        """Tìm tất cả documents"""
        filter_dict = filter_dict or {}
        cursor = self.collection.find(filter_dict)
        
        if sort:
            cursor = cursor.sort(sort)
        
        cursor = cursor.skip(skip).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for doc in documents:
            doc["_id"] = str(doc["_id"])
        
        return documents

    async def count(self, filter_dict: Optional[Dict] = None) -> int:
        """Đếm số documents"""
        filter_dict = filter_dict or {}
        return await self.collection.count_documents(filter_dict)

    async def find_by_id(self, id: str) -> Optional[Dict]:
        """Tìm document theo ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(id)})
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception:
            return None

    async def find_one(self, filter_dict: Dict) -> Optional[Dict]:
        """Tìm một document theo filter"""
        doc = await self.collection.find_one(filter_dict)
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc

    async def create(self, data: Dict) -> Dict:
        """Tạo document mới"""
        result = await self.collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def update(self, id: str, data: Dict) -> Optional[Dict]:
        """Cập nhật document"""
        # Loại bỏ các field None
        update_data = {k: v for k, v in data.items() if v is not None}
        
        if not update_data:
            return await self.find_by_id(id)

        result = await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            existing = await self.find_by_id(id)
            if not existing:
                raise NotFoundError(f"Document not found: {id}")
        
        return await self.find_by_id(id)

    async def delete(self, id: str) -> bool:
        """Xóa document"""
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise NotFoundError(f"Document not found: {id}")
        return True

    async def delete_many(self, filter_dict: Dict) -> int:
        """Xóa nhiều documents"""
        result = await self.collection.delete_many(filter_dict)
        return result.deleted_count
