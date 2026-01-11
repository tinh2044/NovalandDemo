from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class PyObjectId(str):
    """Custom type cho MongoDB ObjectId"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        from bson import ObjectId
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        raise ValueError("Invalid ObjectId")


class BaseSchema(BaseModel):
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FindBase(BaseModel):
    page: Optional[int] = 1
    page_size: Optional[int] = 20


class SearchOptions(BaseModel):
    page: int
    page_size: int
    total_count: int


class FindResult(BaseModel):
    items: List[Any] = []
    search_options: SearchOptions


class MessageResponse(BaseModel):
    message: str
    success: bool = True
