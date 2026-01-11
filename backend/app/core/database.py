from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient
from typing import Optional

from app.core.config import configs


class MongoDB:
    client: Optional[MongoClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    def __init__(self, url: str, db_name: str):
        self.url = url
        self.db_name = db_name

    def connect(self):
        """Kết nối MongoDB"""
        self.client = AsyncIOMotorClient(self.url)
        self.db = self.client[self.db_name]
        print(f"Connected to MongoDB: {self.db_name}")
        return self.db

    def close(self):
        """Đóng kết nối"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

    def get_database(self) -> AsyncIOMotorDatabase:
        """Lấy database instance"""
        if self.db is None:
            self.connect()
        return self.db

    def get_collection(self, name: str):
        """Lấy collection theo tên"""
        return self.get_database()[name]


# Singleton instance
mongodb = MongoDB(url=configs.MONGODB_URL, db_name=configs.MONGODB_DB_NAME)


def get_database() -> AsyncIOMotorDatabase:
    return mongodb.get_database()
