from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.routes import routers as v1_routers
from app.core.config import configs
from app.core.database import mongodb


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager cho FastAPI app"""
    # Startup: kết nối database
    mongodb.connect()
    print("Application started")
    yield
    # Shutdown: đóng kết nối
    mongodb.close()
    print("Application shutdown")


# Tạo FastAPI app
app = FastAPI(
    title=configs.PROJECT_NAME,
    openapi_url=f"{configs.API}/openapi.json",
    version="1.0.0",
    description="API cho Novaland 360° Virtual Tour - CRUD Tours, Scenes, Hotspots",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/")
def root():
    return {"status": "ok", "message": "Novaland Tour API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Include routers
app.include_router(v1_routers, prefix=configs.API_V1_STR)
