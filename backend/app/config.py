from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    # App
    app_name: str = "IT Asset Management & Support System"
    debug: bool = False
    log_level: str = "info"

    # Security
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # Database
    database_url: str = "sqlite:///./it_assets.db"

    # CORS – stored as JSON string in .env e.g. ["http://localhost:5173"]
    backend_cors_origins: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
