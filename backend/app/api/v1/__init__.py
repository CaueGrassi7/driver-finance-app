from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, transactions, categories, analytics

api_router = APIRouter()

# Include authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include user management endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Include transaction endpoints
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

# Include category endpoints
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])

# Include analytics endpoints
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

