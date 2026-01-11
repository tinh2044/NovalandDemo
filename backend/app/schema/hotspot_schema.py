from typing import Optional, List
from pydantic import BaseModel, Field
from app.schema.base_schema import BaseSchema, FindBase, SearchOptions


class Position(BaseModel):
    """Tọa độ 3D của hotspot"""
    x: float = Field(..., description="Tọa độ X")
    y: float = Field(..., description="Tọa độ Y")
    z: float = Field(..., description="Tọa độ Z")


class HotspotBase(BaseModel):
    """Base schema cho Hotspot"""
    type: str = Field(default="click", description="Loại hotspot: click hoặc zoom")
    position: Position = Field(..., description="Tọa độ 3D của hotspot")
    target_scene: str = Field(..., description="ID của scene đích")
    label: str = Field(..., description="Nhãn hiển thị")
    fov_trigger: Optional[float] = Field(None, description="FOV trigger cho zoom hotspot")


class HotspotCreate(HotspotBase):
    """Schema để tạo hotspot mới"""
    scene_id: str = Field(..., description="ID của scene chứa hotspot")


class HotspotUpdate(BaseModel):
    """Schema để cập nhật hotspot"""
    type: Optional[str] = None
    position: Optional[Position] = None
    target_scene: Optional[str] = None
    label: Optional[str] = None
    fov_trigger: Optional[float] = None


class HotspotInDB(HotspotBase):
    """Schema hotspot trong database"""
    id: str = Field(..., alias="_id")
    scene_id: str

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class HotspotResponse(HotspotBase):
    """Schema response cho hotspot"""
    id: str
    scene_id: str


class FindHotspot(FindBase):
    """Schema để tìm kiếm hotspot"""
    scene_id: Optional[str] = None
    type: Optional[str] = None


class FindHotspotResult(BaseModel):
    """Kết quả tìm kiếm hotspot"""
    items: List[HotspotResponse] = []
    search_options: SearchOptions
