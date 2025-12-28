import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

from app.api.v1 import api_router
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Retry logic for database connectivity at startup
    from app.core.config import get_settings
    settings = get_settings()
    
    # Show connection details (hiding password)
    db_url = settings.database_url.replace(settings.POSTGRES_PASSWORD, "****")
    print(f"🔌 Attempting to connect to: {db_url}")
    
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            print("✅ Database connection established successfully")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⚠️  Database connection attempt {attempt + 1} failed: {e}")
                print(f"   Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                print(f"❌ Failed to connect to database after {max_retries} attempts")
                raise
    
    yield


app = FastAPI(
    title="Driver Finance App",
    description="Driver Finance App backend services",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
