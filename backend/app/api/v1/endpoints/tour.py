from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.services.tour_service import TourService
from app.schema.tour_schema import (
    TourCreate,
    TourUpdate,
    TourResponse,
    TourWithScenes,
    TourExport,
    FindTourResult,
)
from app.schema.base_schema import MessageResponse

router = APIRouter(prefix="/tours", tags=["tours"])

tour_service = TourService()


@router.get("", response_model=FindTourResult)
async def get_tours(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    name: Optional[str] = None,
):
    """Lấy danh sách tours"""
    filter_dict = {}
    if name:
        filter_dict["name"] = {"$regex": name, "$options": "i"}

    result = await tour_service.get_list(filter_dict, page, page_size)

    # Convert _id -> id cho response
    result["items"] = [
        TourResponse(id=item["_id"], **{k: v for k, v in item.items() if k != "_id"})
        for item in result["items"]
    ]
    return result


@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(tour_id: str):
    """Lấy thông tin tour theo ID"""
    tour = await tour_service.get_by_id(tour_id)
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return TourResponse(id=tour["_id"], **{k: v for k, v in tour.items() if k != "_id"})


@router.get("/{tour_id}/full", response_model=TourWithScenes)
async def get_tour_full(tour_id: str):
    """Lấy tour đầy đủ với scenes và hotspots"""
    tour = await tour_service.get_tour_with_scenes(tour_id)
    return tour


@router.get("/{tour_id}/export")
async def export_tour(tour_id: str):
    """Export tour sang JSON format cho frontend"""
    return await tour_service.export_tour_json(tour_id)


@router.post("", response_model=TourResponse)
async def create_tour(tour: TourCreate):
    """Tạo tour mới"""
    tour_data = tour.model_dump()
    result = await tour_service.create(tour_data)
    return TourResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.patch("/{tour_id}", response_model=TourResponse)
async def update_tour(tour_id: str, tour: TourUpdate):
    """Cập nhật tour"""
    tour_data = tour.model_dump(exclude_none=True)
    result = await tour_service.update(tour_id, tour_data)
    if not result:
        raise HTTPException(status_code=404, detail="Tour not found")
    return TourResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.delete("/{tour_id}", response_model=MessageResponse)
async def delete_tour(tour_id: str):
    """Xóa tour và tất cả scenes, hotspots liên quan"""
    await tour_service.delete_tour_cascade(tour_id)
    return MessageResponse(message="Tour deleted successfully")
