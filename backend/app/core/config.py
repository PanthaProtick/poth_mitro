import json
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DhakaPath Local API"
    ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    DATABASE_PATH: str = "data/dhakapath.db"
    LLM_PROVIDER: str = "none"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GEMINI_TIMEOUT_SECONDS: float = 8.0
    CHAT_SESSION_TTL_HOURS: int = 24
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("DATABASE_PATH")
    @classmethod
    def validate_database_path(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("DATABASE_PATH must be a non-empty local SQLite file path")
        if value == ":memory:":
            raise ValueError("In-memory SQLite is not supported; configure a persistent file path")
        if "://" in value:
            raise ValueError("DATABASE_PATH must be a filesystem path; remote database URLs are not supported")
        return value

    @field_validator("LLM_PROVIDER")
    @classmethod
    def validate_llm_provider(cls, value: str) -> str:
        value = value.strip().casefold()
        if value not in {"none", "gemini"}:
            raise ValueError("LLM_PROVIDER must be 'none' or 'gemini'")
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
