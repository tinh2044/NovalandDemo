from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict
import json

from app.services.tour_service import TourService
from app.services.scene_service import SceneService
from app.services.hotspot_service import HotspotService

router = APIRouter(prefix="/import", tags=["import-export"])

tour_service = TourService()
scene_service = SceneService()
hotspot_service = HotspotService()


@router.post("/tour-json")
async def import_tour_from_json(data: Dict):
    """
    Import tour từ JSON format (giống tour.json của frontend)

    Expected format:
    {
        "name": "Tour Name",
        "entryScene": "scene_id",
        "scenes": {
            "scene_id": {
                "id": "scene_id",
                "name": "Scene Name",
                "description": "Description",
                "image": "/path/to/image",
                "initialView": {"yaw": 0, "pitch": 0, "fov": 100},
                "hotspots": [
                    {
                        "id": "hotspot_id",
                        "type": "click",
                        "position": {"x": 0, "y": 0, "z": 0},
                        "targetScene": "target_id",
                        "label": "Label"
                    }
                ]
            }
        }
    }
    """
    try:
        # 1. Tạo tour
        tour_data = {
            "name": data.get("name", "Imported Tour"),
            "entry_scene": None,  # Sẽ cập nhật sau
        }
        tour = await tour_service.create(tour_data)
        tour_id = tour["_id"]

        # Map từ old scene id sang new scene id
        scene_id_map = {}

        # 2. Tạo scenes
        scenes_data = data.get("scenes", {})
        for old_scene_id, scene_info in scenes_data.items():
            scene_data = {
                "tour_id": tour_id,
                "name": scene_info.get("name", ""),
                "description": scene_info.get("description", ""),
                "image_url": scene_info.get("image", ""),
                "initial_view": scene_info.get(
                    "initialView", {"yaw": 0, "pitch": 0, "fov": 100}
                ),
            }
            scene = await scene_service.create(scene_data)
            scene_id_map[old_scene_id] = scene["_id"]

        # 3. Cập nhật entry_scene với new scene id
        entry_scene = data.get("entryScene", "")
        if entry_scene and entry_scene in scene_id_map:
            await tour_service.update(
                tour_id, {"entry_scene": scene_id_map[entry_scene]}
            )

        # 4. Tạo hotspots với mapped scene ids
        for old_scene_id, scene_info in scenes_data.items():
            new_scene_id = scene_id_map.get(old_scene_id)
            if not new_scene_id:
                continue

            hotspots = scene_info.get("hotspots", [])
            for hotspot_info in hotspots:
                target_scene = hotspot_info.get("targetScene", "")
                new_target_scene = scene_id_map.get(target_scene, target_scene)

                hotspot_data = {
                    "scene_id": new_scene_id,
                    "type": hotspot_info.get("type", "click"),
                    "position": hotspot_info.get("position", {"x": 0, "y": 0, "z": 0}),
                    "target_scene": new_target_scene,
                    "label": hotspot_info.get("label", ""),
                    "fov_trigger": hotspot_info.get("fovTrigger"),
                }
                await hotspot_service.create_hotspot(hotspot_data)

        return {
            "success": True,
            "message": "Tour imported successfully",
            "tour_id": tour_id,
            "scene_id_map": scene_id_map,
            "scenes_count": len(scene_id_map),
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/tour-file")
async def import_tour_from_file(file: UploadFile = File(...)):
    """Import tour từ file JSON"""
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="File must be JSON")

    try:
        contents = await file.read()
        data = json.loads(contents.decode("utf-8"))
        return await import_tour_from_json(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
