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

    # Database Configuration (Required - no defaults for security)
    POSTGRES_USER: str = Field(..., description="Database user")
    POSTGRES_PASSWORD: str = Field(..., min_length=8, description="Database password")
    POSTGRES_SERVER: str = Field(default="db", description="Database server")
    POSTGRES_PORT: int = Field(default=5432, description="Database port")
    POSTGRES_DB: str = Field(..., description="Database name")
    DATABASE_URL: Optional[PostgresDsn] = None

    # JWT Settings (Required - no defaults for security)
    SECRET_KEY: str = Field(..., min_length=32, description="JWT secret key for token signing")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Token expiration in minutes")

    # First Superuser (Required - no defaults for security)
    FIRST_SUPERUSER_EMAIL: str = Field(..., description="First superuser email")
    FIRST_SUPERUSER_PASSWORD: str = Field(..., min_length=12, description="First superuser password")
    FIRST_SUPERUSER_FULL_NAME: str = Field(default="Admin User", description="First superuser full name")

    # Environment & CORS
    ENVIRONMENT: str = Field(default="production", description="Environment: development or production")
    FRONTEND_URL: str = Field(default="*", description="Frontend URL for CORS configuration")

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
