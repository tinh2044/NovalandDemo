from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from app.services.hotspot_service import HotspotService
from app.schema.hotspot_schema import (
    HotspotCreate,
    HotspotUpdate,
    HotspotResponse,
    FindHotspotResult,
    Position,
)
from app.schema.base_schema import MessageResponse

router = APIRouter(prefix="/hotspots", tags=["hotspots"])

hotspot_service = HotspotService()


@router.get("", response_model=FindHotspotResult)
async def get_hotspots(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    scene_id: Optional[str] = None,
    type: Optional[str] = None,
):
    """Get list of hotspots"""
    filter_dict = {}
    if scene_id:
        filter_dict["scene_id"] = scene_id
    if type:
        filter_dict["type"] = type

    result = await hotspot_service.get_list(filter_dict, page, page_size)
    
    # Convert _id -> id cho response
    result["items"] = [
        HotspotResponse(id=item["_id"], **{k: v for k, v in item.items() if k != "_id"})
        for item in result["items"]
    ]
    return result


@router.get("/by-scene/{scene_id}")
async def get_hotspots_by_scene(scene_id: str):
    """Get all hotspots by scene id"""
    hotspots = await hotspot_service.get_hotspots_by_scene(scene_id)
    # Convert _id -> id cho response
    items = [
        HotspotResponse(id=h["_id"], **{k: v for k, v in h.items() if k != "_id"})
        for h in hotspots
    ]
    return {"items": items, "total": len(items)}


@router.get("/{hotspot_id}", response_model=HotspotResponse)
async def get_hotspot(hotspot_id: str):
    """Get hotspot by id"""
    hotspot = await hotspot_service.get_by_id(hotspot_id)
    if not hotspot:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return HotspotResponse(
        id=hotspot["_id"], **{k: v for k, v in hotspot.items() if k != "_id"}
    )


@router.post("", response_model=HotspotResponse)
async def create_hotspot(hotspot: HotspotCreate):
    """Create new hotspot"""
    hotspot_data = hotspot.dict()

    # Convert position to dict
    if hasattr(hotspot_data.get("position"), "dict"):
        hotspot_data["position"] = hotspot_data["position"].dict()

    result = await hotspot_service.create_hotspot(hotspot_data)
    return HotspotResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.post("/bulk")
async def create_hotspots_bulk(hotspots: List[HotspotCreate]):
    """Create multiple hotspots at once"""
    hotspots_data = []
    for h in hotspots:
        data = h.dict()
        if hasattr(data.get("position"), "dict"):
            data["position"] = data["position"].dict()
        hotspots_data.append(data)

    results = await hotspot_service.bulk_create(hotspots_data)
    return {"items": results, "total": len(results)}


@router.patch("/{hotspot_id}", response_model=HotspotResponse)
async def update_hotspot(hotspot_id: str, hotspot: HotspotUpdate):
    """Update hotspot"""
    hotspot_data = hotspot.dict(exclude_none=True)

    # Convert position to dict if present
    if "position" in hotspot_data and hasattr(hotspot_data["position"], "dict"):
        hotspot_data["position"] = hotspot_data["position"].dict()

    result = await hotspot_service.update(hotspot_id, hotspot_data)
    if not result:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return HotspotResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.patch("/{hotspot_id}/position", response_model=HotspotResponse)
async def update_hotspot_position(hotspot_id: str, position: Position):
    """Update hotspot position"""
    result = await hotspot_service.update_hotspot_position(hotspot_id, position.dict())
    if not result:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return HotspotResponse(
        id=result["_id"], **{k: v for k, v in result.items() if k != "_id"}
    )


@router.delete("/{hotspot_id}", response_model=MessageResponse)
async def delete_hotspot(hotspot_id: str):
    """Delete hotspot"""
    await hotspot_service.delete(hotspot_id)
    return MessageResponse(message="Hotspot deleted successfully")


@router.delete("/by-scene/{scene_id}", response_model=MessageResponse)
async def delete_hotspots_by_scene(scene_id: str):
    """Delete all hotspots by scene id"""
    count = await hotspot_service.bulk_delete_by_scene(scene_id)
    return MessageResponse(message=f"Deleted {count} hotspots")
