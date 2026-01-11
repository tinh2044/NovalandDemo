import os
from typing import List

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Configs(BaseSettings):
    # Base
    ENV: str = os.getenv("ENV", "dev")
    API: str = "/api"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Novaland Tour API"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "novaland_tour")

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

    # Pagination
    PAGE: int = 1
    PAGE_SIZE: int = 20

    model_config = SettingsConfigDict(case_sensitive=True)


configs = Configs()
