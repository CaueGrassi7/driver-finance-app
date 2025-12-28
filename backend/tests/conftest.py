"""
Test Configuration Module

This module provides pytest fixtures for testing the FastAPI application.
It includes fixtures for:
- Async database engine and session management
- Test database creation/cleanup
- HTTP client for API testing
- Dependency overrides for FastAPI
"""

import asyncio
import os
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.core.database import Base, get_db
from app.main import app

# Get settings
settings = get_settings()

# Override database host for local testing
# When running tests locally (outside Docker), use localhost instead of 'db'
TEST_POSTGRES_SERVER = os.getenv("TEST_POSTGRES_SERVER", "localhost")


# ==================== Event Loop Configuration ====================
@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """
    Create an event loop for the entire test session.
    
    This is crucial for async tests to work properly.
    Using session scope ensures all async tests share the same event loop.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ==================== Database Configuration ====================
@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """
    Create a test-specific async database engine.
    
    This engine connects to a separate test database to avoid
    polluting the development database.
    
    Configuration:
    - Uses NullPool to prevent connection pooling issues in tests
    - Database name is suffixed with '_test'
    - Echo is disabled for cleaner test output
    - Uses localhost for database host when running tests locally
    """
    # Build test database URL with localhost for local testing
    # Replace 'db' (Docker service name) with 'localhost' or TEST_POSTGRES_SERVER
    test_db_url = settings.database_url.replace(
        f"@{settings.POSTGRES_SERVER}:",
        f"@{TEST_POSTGRES_SERVER}:"
    ).replace(
        settings.POSTGRES_DB, 
        f"{settings.POSTGRES_DB}_test"
    )
    
    # Create async engine for test database
    engine = create_async_engine(
        test_db_url,
        echo=False,
        poolclass=NullPool,  # Disable connection pooling for tests
    )
    
    # Create all tables before tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables after tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_session_maker(
    test_engine: AsyncEngine,
) -> async_sessionmaker[AsyncSession]:
    """
    Create a session maker for test database.
    
    This fixture is function-scoped to ensure each test
    gets a fresh session maker.
    """
    return async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@pytest_asyncio.fixture(scope="function")
async def db_session(
    test_session_maker: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a test database session.
    
    This fixture:
    - Creates a new session for each test
    - Yields the session for test execution
    - Automatically rolls back after each test to ensure isolation
    - Closes the session properly
    
    This ensures each test runs in isolation with a clean database state.
    """
    async with test_session_maker() as session:
        yield session
        await session.rollback()
        await session.close()


# ==================== FastAPI Client Configuration ====================
@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an async HTTP client for testing FastAPI endpoints.
    
    This fixture:
    - Overrides the get_db dependency to use the test database
    - Creates an AsyncClient with ASGI transport
    - Properly handles lifespan events
    - Cleans up after each test
    
    Usage in tests:
        async def test_example(client: AsyncClient):
            response = await client.get("/api/v1/endpoint")
            assert response.status_code == 200
    """
    
    # Override the get_db dependency to use test database
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    # Create async client with ASGI transport
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=True,
    ) as test_client:
        yield test_client
    
    # Clear dependency overrides after test
    app.dependency_overrides.clear()


# ==================== Helper Fixtures ====================
@pytest.fixture
def user_data() -> dict[str, Any]:
    """
    Provide sample user data for testing.
    
    Returns:
        Dictionary with valid user registration data
    """
    return {
        "email": "testuser@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
    }


@pytest.fixture
def user_data_2() -> dict[str, Any]:
    """
    Provide alternative user data for testing multiple users.
    
    Returns:
        Dictionary with valid user registration data for a second user
    """
    return {
        "email": "testuser2@example.com",
        "password": "AnotherPassword456!",
        "full_name": "Test User Two",
    }


@pytest_asyncio.fixture
async def test_user(
    client: AsyncClient, 
    user_data: dict[str, Any]
) -> dict[str, Any]:
    """
    Create a test user and return user data with auth token.
    
    This fixture:
    - Registers a new user via the signup endpoint
    - Logs in to get an auth token
    - Returns user data including the access token
    
    Returns:
        Dictionary containing user data and access_token
    """
    # Register user
    signup_response = await client.post(
        "/api/v1/signup",
        json=user_data,
    )
    assert signup_response.status_code == 201
    
    # Login to get token
    login_response = await client.post(
        "/api/v1/login",
        data={
            "username": user_data["email"],
            "password": user_data["password"],
        },
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    
    return {
        **user_data,
        "access_token": token_data["access_token"],
    }


@pytest.fixture
def auth_headers(test_user: dict[str, Any]) -> dict[str, str]:
    """
    Provide authentication headers for testing protected endpoints.
    
    Args:
        test_user: Test user fixture with access token
        
    Returns:
        Dictionary with Authorization header
    """
    return {
        "Authorization": f"Bearer {test_user['access_token']}"
    }

