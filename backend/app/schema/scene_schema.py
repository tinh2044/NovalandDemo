from typing import Optional, List
from pydantic import BaseModel, Field
from app.schema.base_schema import FindBase, SearchOptions
from app.schema.hotspot_schema import HotspotResponse


class InitialView(BaseModel):
    """Góc nhìn ban đầu của scene"""

    yaw: float = Field(default=0, description="Góc ngang (radians)")
    pitch: float = Field(default=0, description="Góc dọc (radians)")
    fov: float = Field(default=100, description="Field of View")


class SceneBase(BaseModel):
    """Base schema cho Scene"""

    name: str = Field(..., description="Tên scene")
    description: Optional[str] = Field(None, description="Mô tả scene")
    initial_view: InitialView = Field(
        default_factory=InitialView, description="Góc nhìn ban đầu"
    )


class SceneCreate(SceneBase):
    """Schema để tạo scene mới"""

    tour_id: str = Field(..., description="ID của tour chứa scene")
    image_url: Optional[str] = Field(None, description="URL ảnh 360° của scene")


class SceneUpdate(BaseModel):
    """Schema để cập nhật scene"""

    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    initial_view: Optional[InitialView] = None


class SceneInDB(SceneBase):
    """Schema scene trong database"""

    id: str = Field(..., alias="_id")
    tour_id: str
    image_url: Optional[str] = None
    image_public_id: Optional[str] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class SceneResponse(SceneBase):
    """Schema response cho scene"""

    id: str
    tour_id: str
    image_url: Optional[str] = None


class SceneWithHotspots(SceneResponse):
    """Scene kèm danh sách hotspots"""

    hotspots: List[HotspotResponse] = []


class FindScene(FindBase):
    """Schema để tìm kiếm scene"""

    tour_id: Optional[str] = None
    name: Optional[str] = None


class FindSceneResult(BaseModel):
    """Kết quả tìm kiếm scene"""

    items: List[SceneResponse] = []
    search_options: SearchOptions
