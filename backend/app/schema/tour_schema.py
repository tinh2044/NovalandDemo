from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime
from app.schema.base_schema import BaseSchema, FindBase, SearchOptions
from app.schema.scene_schema import SceneWithHotspots


class TourBase(BaseModel):
    """Base schema cho Tour"""
    name: str = Field(..., description="Tên tour")
    entry_scene: Optional[str] = Field(None, description="ID scene bắt đầu")


class TourCreate(TourBase):
    """Schema để tạo tour mới"""
    pass


class TourUpdate(BaseModel):
    """Schema để cập nhật tour"""
    name: Optional[str] = None
    entry_scene: Optional[str] = None


class TourInDB(TourBase):
    """Schema tour trong database"""
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class TourResponse(TourBase):
    """Schema response cho tour"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class TourWithScenes(TourResponse):
    """Tour kèm danh sách scenes và hotspots"""
    scenes: Dict[str, SceneWithHotspots] = {}


class TourExport(BaseModel):
    """Schema export tour ra JSON (format cho frontend)"""
    name: str
    entryScene: str
    scenes: Dict[str, dict]


class FindTour(FindBase):
    """Schema để tìm kiếm tour"""
    name: Optional[str] = None


class FindTourResult(BaseModel):
    """Kết quả tìm kiếm tour"""
    items: List[TourResponse] = []
    search_options: SearchOptions
