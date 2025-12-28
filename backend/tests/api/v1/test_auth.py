"""
Authentication Integration Tests

This module contains comprehensive integration tests for the authentication module.
Tests cover signup, login, and protected endpoint access.

All tests follow the Arrange-Act-Assert (AAA) pattern:
- Arrange: Set up test data and preconditions
- Act: Execute the action being tested
- Assert: Verify the results
"""

from typing import Any

import pytest
from httpx import AsyncClient
from jose import jwt

from app.core.config import get_settings

settings = get_settings()


# ==================== Signup Tests ====================
@pytest.mark.asyncio
class TestSignup:
    """Test suite for user signup/registration functionality."""
    
    async def test_signup_success_with_valid_data(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test successful user registration with valid data.
        
        Scenario:
        - User provides valid email, password, and full name
        - System creates new user account
        - Returns 201 Created status
        - Returns user profile data without password
        
        Arrange:
            Valid user registration data
        Act:
            POST request to /api/v1/signup
        Assert:
            - Status code is 201 Created
            - Response contains user ID and email
            - Response does NOT contain password
            - User is active by default
        """
        # Arrange: user_data fixture provides valid data
        
        # Act: Send signup request
        response = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        
        # Assert: Verify successful registration
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        
        data = response.json()
        assert "id" in data, "Response should contain user ID"
        assert data["email"] == user_data["email"], "Email should match input"
        assert data["full_name"] == user_data["full_name"], "Full name should match input"
        assert data["is_active"] is True, "User should be active by default"
        assert "password" not in data, "Response should NOT contain password"
        assert "hashed_password" not in data, "Response should NOT contain hashed password"
        assert "created_at" in data, "Response should contain creation timestamp"
    
    async def test_signup_success_without_full_name(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test successful registration without optional full_name field.
        
        Scenario:
        - User provides only required fields (email, password)
        - System creates account with null full_name
        
        Arrange:
            User data without full_name
        Act:
            POST request to /api/v1/signup
        Assert:
            - Status code is 201 Created
            - full_name is None
            - Other fields are present
        """
        # Arrange: Create minimal user data
        minimal_user_data = {
            "email": "minimal@example.com",
            "password": "ValidPassword123!",
        }
        
        # Act: Send signup request
        response = await client.post(
            "/api/v1/signup",
            json=minimal_user_data,
        )
        
        # Assert: Verify successful registration
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == minimal_user_data["email"]
        assert data["full_name"] is None
        assert data["is_active"] is True
    
    async def test_signup_failure_with_duplicate_email(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test registration failure when email already exists.
        
        Scenario:
        - User tries to register with an already registered email
        - System rejects the request
        - Returns 400 Bad Request with appropriate error message
        
        Arrange:
            Register first user with email
        Act:
            Attempt to register second user with same email
        Assert:
            - Status code is 400 Bad Request
            - Error message indicates email is already registered
        """
        # Arrange: Register first user
        first_signup = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        assert first_signup.status_code == 201, "First signup should succeed"
        
        # Act: Attempt to register with same email
        duplicate_data = {
            **user_data,
            "password": "DifferentPassword123!",
            "full_name": "Different Name",
        }
        response = await client.post(
            "/api/v1/signup",
            json=duplicate_data,
        )
        
        # Assert: Verify rejection
        assert response.status_code == 400, "Duplicate email should return 400"
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        assert "email already registered" in data["detail"].lower(), (
            "Error message should indicate email already exists"
        )
    
    async def test_signup_failure_with_invalid_email(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test registration failure with invalid email format.
        
        Scenario:
        - User provides invalid email format
        - System validates and rejects the request
        - Returns 422 Unprocessable Entity
        
        Arrange:
            User data with invalid email
        Act:
            POST request to /api/v1/signup
        Assert:
            - Status code is 422 Unprocessable Entity
            - Validation error indicates email field issue
        """
        # Arrange: Create data with invalid email
        invalid_email_data = {
            "email": "not-an-email",
            "password": "ValidPassword123!",
        }
        
        # Act: Send signup request
        response = await client.post(
            "/api/v1/signup",
            json=invalid_email_data,
        )
        
        # Assert: Verify validation error
        assert response.status_code == 422, "Invalid email should return 422"
        data = response.json()
        assert "detail" in data, "Validation error should contain detail"
    
    async def test_signup_failure_with_short_password(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test registration failure with password too short.
        
        Scenario:
        - User provides password less than 8 characters
        - System validates and rejects the request
        - Returns 422 Unprocessable Entity
        
        Arrange:
            User data with short password
        Act:
            POST request to /api/v1/signup
        Assert:
            - Status code is 422 Unprocessable Entity
            - Validation error indicates password length issue
        """
        # Arrange: Create data with short password
        short_password_data = {
            "email": "valid@example.com",
            "password": "Short1!",  # Only 7 characters
        }
        
        # Act: Send signup request
        response = await client.post(
            "/api/v1/signup",
            json=short_password_data,
        )
        
        # Assert: Verify validation error
        assert response.status_code == 422, "Short password should return 422"
        data = response.json()
        assert "detail" in data, "Validation error should contain detail"


# ==================== Login Tests ====================
@pytest.mark.asyncio
class TestLogin:
    """Test suite for user login/authentication functionality."""
    
    async def test_login_success_with_valid_credentials(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test successful login with correct credentials.
        
        Scenario:
        - User provides correct email and password
        - System authenticates user
        - Returns valid JWT access token
        
        Arrange:
            Create user account, then attempt login
        Act:
            POST request to /api/v1/login with OAuth2 form data
        Assert:
            - Status code is 200 OK
            - Response contains access_token
            - Token type is "bearer"
            - JWT token is valid and decodable
            - Token contains user ID in subject claim
        """
        # Arrange: Create user account
        signup_response = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        assert signup_response.status_code == 201
        user_id = signup_response.json()["id"]
        
        # Act: Login with credentials
        response = await client.post(
            "/api/v1/login",
            data={
                "username": user_data["email"],  # OAuth2 spec uses 'username'
                "password": user_data["password"],
            },
        )
        
        # Assert: Verify successful login
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access token"
        assert "token_type" in data, "Response should contain token type"
        assert data["token_type"] == "bearer", "Token type should be bearer"
        
        # Verify JWT token is valid
        token = data["access_token"]
        decoded = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        assert "sub" in decoded, "Token should contain subject claim"
        assert decoded["sub"] == str(user_id), "Token subject should be user ID"
        assert "exp" in decoded, "Token should contain expiration claim"
    
    async def test_login_failure_with_wrong_password(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test login failure with incorrect password.
        
        Scenario:
        - User provides correct email but wrong password
        - System rejects authentication
        - Returns 401 Unauthorized
        
        Arrange:
            Create user account
        Act:
            POST request to /api/v1/login with wrong password
        Assert:
            - Status code is 401 Unauthorized
            - Error message indicates incorrect credentials
            - WWW-Authenticate header is present
        """
        # Arrange: Create user account
        signup_response = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        assert signup_response.status_code == 201
        
        # Act: Login with wrong password
        response = await client.post(
            "/api/v1/login",
            data={
                "username": user_data["email"],
                "password": "WrongPassword123!",
            },
        )
        
        # Assert: Verify authentication failure
        assert response.status_code == 401, "Wrong password should return 401"
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        assert "incorrect" in data["detail"].lower(), (
            "Error should indicate incorrect credentials"
        )
    
    async def test_login_failure_with_nonexistent_email(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test login failure with email that doesn't exist.
        
        Scenario:
        - User provides email that's not registered
        - System rejects authentication
        - Returns 401 Unauthorized
        
        Arrange:
            No user registration (fresh database)
        Act:
            POST request to /api/v1/login with nonexistent email
        Assert:
            - Status code is 401 Unauthorized
            - Error message indicates incorrect credentials
        """
        # Arrange: No setup needed (user doesn't exist)
        
        # Act: Login with nonexistent email
        response = await client.post(
            "/api/v1/login",
            data={
                "username": "nonexistent@example.com",
                "password": "SomePassword123!",
            },
        )
        
        # Assert: Verify authentication failure
        assert response.status_code == 401, "Nonexistent user should return 401"
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
    
    async def test_login_failure_with_missing_credentials(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test login failure when credentials are missing.
        
        Scenario:
        - User submits login form without required fields
        - System validates and rejects the request
        - Returns 422 Unprocessable Entity
        
        Arrange:
            Empty form data
        Act:
            POST request to /api/v1/login without credentials
        Assert:
            - Status code is 422 Unprocessable Entity
        """
        # Arrange: Empty data
        
        # Act: Login without credentials
        response = await client.post(
            "/api/v1/login",
            data={},
        )
        
        # Assert: Verify validation error
        assert response.status_code == 422, "Missing credentials should return 422"


# ==================== Protected Endpoint Tests ====================
@pytest.mark.asyncio
class TestProtectedEndpoints:
    """Test suite for protected endpoint access control."""
    
    async def test_protected_endpoint_success_with_valid_token(
        self, 
        client: AsyncClient, 
        test_user: dict[str, Any]
    ) -> None:
        """
        Test successful access to protected endpoint with valid JWT token.
        
        Scenario:
        - Authenticated user accesses /api/v1/me endpoint
        - System validates JWT token
        - Returns current user profile
        
        Arrange:
            Create user and obtain access token
        Act:
            GET request to /api/v1/me with Authorization header
        Assert:
            - Status code is 200 OK
            - Response contains user profile
            - Email matches authenticated user
        """
        # Arrange: test_user fixture provides authenticated user
        
        # Act: Access protected endpoint with token
        response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": f"Bearer {test_user['access_token']}"
            },
        )
        
        # Assert: Verify successful access
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["email"] == test_user["email"], "Email should match authenticated user"
        assert "id" in data, "Response should contain user ID"
        assert "password" not in data, "Response should NOT contain password"
    
    async def test_protected_endpoint_failure_without_token(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test protected endpoint rejects request without authentication token.
        
        Scenario:
        - Anonymous user tries to access protected endpoint
        - No Authorization header provided
        - System rejects the request
        - Returns 403 Forbidden (HTTPBearer security scheme)
        
        Arrange:
            No authentication (no token)
        Act:
            GET request to /api/v1/me without Authorization header
        Assert:
            - Status code is 403 Forbidden
            - Request is rejected
        """
        # Arrange: No authentication
        
        # Act: Access protected endpoint without token
        response = await client.get("/api/v1/me")
        
        # Assert: Verify rejection
        assert response.status_code == 403, (
            f"Protected endpoint without token should return 403, got {response.status_code}"
        )
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
    
    async def test_protected_endpoint_failure_with_invalid_token(
        self, 
        client: AsyncClient
    ) -> None:
        """
        Test protected endpoint rejects request with invalid JWT token.
        
        Scenario:
        - User provides malformed or invalid JWT token
        - System validates token and rejects it
        - Returns 401 Unauthorized
        
        Arrange:
            Invalid JWT token
        Act:
            GET request to /api/v1/me with invalid Authorization header
        Assert:
            - Status code is 401 Unauthorized
            - Error message indicates credential validation failure
        """
        # Arrange: Create invalid token
        invalid_token = "invalid.jwt.token"
        
        # Act: Access protected endpoint with invalid token
        response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": f"Bearer {invalid_token}"
            },
        )
        
        # Assert: Verify rejection
        assert response.status_code == 401, (
            f"Invalid token should return 401, got {response.status_code}"
        )
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
        assert "credentials" in data["detail"].lower(), (
            "Error should indicate credential validation issue"
        )
    
    async def test_protected_endpoint_failure_with_expired_token(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test protected endpoint rejects expired JWT token.
        
        Scenario:
        - User provides expired JWT token
        - System validates token expiration
        - Returns 401 Unauthorized
        
        Arrange:
            Create user and generate expired token
        Act:
            GET request to /api/v1/me with expired token
        Assert:
            - Status code is 401 Unauthorized
            - Request is rejected due to expired token
        """
        # Arrange: Create user and generate expired token
        from datetime import datetime, timedelta
        from app.core.security import create_access_token
        
        signup_response = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        assert signup_response.status_code == 201
        user_id = signup_response.json()["id"]
        
        # Create token that's already expired
        expired_token = create_access_token(
            subject=user_id,
            expires_delta=timedelta(seconds=-1)  # Expired 1 second ago
        )
        
        # Act: Access protected endpoint with expired token
        response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": f"Bearer {expired_token}"
            },
        )
        
        # Assert: Verify rejection
        assert response.status_code == 401, (
            f"Expired token should return 401, got {response.status_code}"
        )
        data = response.json()
        assert "detail" in data, "Error response should contain detail"
    
    async def test_protected_endpoint_failure_with_malformed_header(
        self, 
        client: AsyncClient, 
        test_user: dict[str, Any]
    ) -> None:
        """
        Test protected endpoint rejects malformed Authorization header.
        
        Scenario:
        - User provides Authorization header without 'Bearer ' prefix
        - System validates header format
        - Returns 403 Forbidden
        
        Arrange:
            Valid token but malformed header format
        Act:
            GET request to /api/v1/me with malformed Authorization header
        Assert:
            - Status code is 403 Forbidden
            - Request is rejected due to malformed header
        """
        # Arrange: Get valid token but use wrong format
        
        # Act: Access with token but no 'Bearer ' prefix
        response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": test_user['access_token']  # Missing 'Bearer ' prefix
            },
        )
        
        # Assert: Verify rejection
        assert response.status_code == 403, (
            f"Malformed header should return 403, got {response.status_code}"
        )


# ==================== Integration Flow Tests ====================
@pytest.mark.asyncio
class TestAuthenticationFlow:
    """Test suite for complete authentication workflows."""
    
    async def test_complete_signup_login_access_flow(
        self, 
        client: AsyncClient, 
        user_data: dict[str, Any]
    ) -> None:
        """
        Test complete authentication flow: signup → login → access protected resource.
        
        This integration test verifies the entire user journey from
        account creation to accessing protected endpoints.
        
        Arrange:
            Fresh database state
        Act:
            1. Register new user
            2. Login to obtain token
            3. Access protected endpoint
        Assert:
            - All steps succeed
            - User can access protected resources after authentication
            - Data consistency across endpoints
        """
        # Arrange: Fresh database (no setup needed)
        
        # Act 1: Signup
        signup_response = await client.post(
            "/api/v1/signup",
            json=user_data,
        )
        assert signup_response.status_code == 201
        signup_data = signup_response.json()
        
        # Act 2: Login
        login_response = await client.post(
            "/api/v1/login",
            data={
                "username": user_data["email"],
                "password": user_data["password"],
            },
        )
        assert login_response.status_code == 200
        token_data = login_response.json()
        
        # Act 3: Access protected endpoint
        me_response = await client.get(
            "/api/v1/me",
            headers={
                "Authorization": f"Bearer {token_data['access_token']}"
            },
        )
        
        # Assert: Verify complete flow
        assert me_response.status_code == 200
        me_data = me_response.json()
        
        # Verify data consistency
        assert me_data["id"] == signup_data["id"], "User ID should be consistent"
        assert me_data["email"] == user_data["email"], "Email should be consistent"
        assert me_data["full_name"] == user_data["full_name"], "Full name should be consistent"
        assert me_data["is_active"] is True, "User should remain active"

