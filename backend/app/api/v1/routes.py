from fastapi import APIRouter

from app.api.v1.endpoints.tour import router as tour_router
from app.api.v1.endpoints.scene import router as scene_router
from app.api.v1.endpoints.hotspot import router as hotspot_router
from app.api.v1.endpoints.import_export import router as import_router

routers = APIRouter()

router_list = [tour_router, scene_router, hotspot_router, import_router]

for router in router_list:
    routers.include_router(router)
