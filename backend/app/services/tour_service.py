from typing import Dict, List

from app.services.base_service import BaseService
from app.repository.tour_repository import TourRepository
from app.repository.scene_repository import SceneRepository
from app.repository.hotspot_repository import HotspotRepository
from app.core.exceptions import NotFoundError


class TourService(BaseService):
    """Service cho Tour"""

    def __init__(self):
        self.repository = TourRepository()
        self.scene_repository = SceneRepository()
        self.hotspot_repository = HotspotRepository()

    async def get_tour_with_scenes(self, tour_id: str) -> Dict:
        """Lấy tour kèm tất cả scenes và hotspots"""
        tour = await self.repository.find_by_id(tour_id)
        if not tour:
            raise NotFoundError(f"Tour not found: {tour_id}")

        scenes = await self.scene_repository.find_by_tour_id(tour_id)

        scenes_dict = {}
        for scene in scenes:
            scene_id = scene["_id"]
            hotspots = await self.hotspot_repository.find_by_scene_id(scene_id)

            # Format hotspots cho frontend
            formatted_hotspots = []
            for h in hotspots:
                formatted_hotspots.append(
                    {
                        "id": h["_id"],
                        "type": h.get("type", "click"),
                        "position": h.get("position", {"x": 0, "y": 0, "z": 0}),
                        "targetScene": h.get("target_scene"),
                        "label": h.get("label", ""),
                        "fovTrigger": h.get("fov_trigger"),
                    }
                )

            scenes_dict[scene_id] = {
                "id": scene_id,
                "name": scene.get("name", ""),
                "description": scene.get("description", ""),
                "image": scene.get("image_url", ""),
                "initialView": scene.get(
                    "initial_view", {"yaw": 0, "pitch": 0, "fov": 100}
                ),
                "hotspots": formatted_hotspots,
            }

        tour["scenes"] = scenes_dict
        return tour

    async def export_tour_json(self, tour_id: str) -> Dict:
        """Export tour sang JSON format cho frontend"""
        tour = await self.get_tour_with_scenes(tour_id)

        return {
            "name": tour.get("name", ""),
            "entryScene": tour.get("entry_scene", ""),
            "scenes": tour.get("scenes", {}),
        }

    async def delete_tour_cascade(self, tour_id: str) -> bool:
        """Xóa tour và tất cả scenes, hotspots liên quan"""
        # Xóa hotspots
        await self.hotspot_repository.delete_by_tour_id(tour_id)
        # Xóa scenes
        await self.scene_repository.delete_by_tour_id(tour_id)
        # Xóa tour
        return await self.repository.delete(tour_id)
