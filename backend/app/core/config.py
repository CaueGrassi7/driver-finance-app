from functools import lru_cache
from typing import Optional

from pydantic import Field, PostgresDsn, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "db"  # Docker service name
    POSTGRES_PORT: int = 5432  # Internal Docker port (always 5432 inside Docker network)
    POSTGRES_DB: str = "driver_finance_db"
    DATABASE_URL: Optional[PostgresDsn] = None

    @field_validator("DATABASE_URL")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: ValidationInfo) -> str:
        if isinstance(v, str) and v:
            return v

        data = info.data
        user = data.get("POSTGRES_USER")
        password = data.get("POSTGRES_PASSWORD")
        server = data.get("POSTGRES_SERVER")
        port = data.get("POSTGRES_PORT")
        db = data.get("POSTGRES_DB")

        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=user,
            password=password,
            host=server,
            port=port,
            path=f"{db}",
        )

    @property
    def database_url(self) -> str:
        return str(self.DATABASE_URL)


@lru_cache
def get_settings() -> Settings:
    return Settings()
