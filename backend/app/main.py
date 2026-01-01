import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.api.v1 import api_router
from app.core.database import engine
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Retry logic for database connectivity at startup
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

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS middleware
settings = get_settings()
origins = []

if settings.ENVIRONMENT == "development":
    # Allow all origins in development
    origins = ["*"]
else:
    # Restrict to specific origins in production
    if settings.FRONTEND_URL and settings.FRONTEND_URL != "*":
        origins = [settings.FRONTEND_URL]
    else:
        # Default to all origins if not configured (should be set in production!)
        origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
