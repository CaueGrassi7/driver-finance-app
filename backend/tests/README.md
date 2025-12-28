# Testing Infrastructure Documentation

## Overview

This document describes the complete testing infrastructure for the Driver Finance App backend. The test suite includes comprehensive integration tests for the authentication module and provides a solid foundation for adding more tests.

## Architecture

### Technology Stack

- **pytest**: Modern Python testing framework
- **pytest-asyncio**: Async/await support for pytest
- **httpx**: Async HTTP client for testing FastAPI endpoints
- **faker**: Generate realistic test data
- **SQLAlchemy 2.0**: Async database ORM
- **PostgreSQL**: Test database (separate from dev/prod)

### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py                 # Core test configuration and fixtures
├── README.md                   # This file
└── api/
    ├── __init__.py
    └── v1/
        ├── __init__.py
        └── test_auth.py        # Authentication integration tests
```

## Configuration

### pytest.ini

The `pytest.ini` file configures pytest behavior:

- **Test Discovery**: Automatically finds `test_*.py` files
- **Asyncio Mode**: Set to `auto` for seamless async testing
- **Output**: Verbose mode with local variables in tracebacks
- **Markers**: Custom markers for test categorization

### conftest.py - Core Test Infrastructure

The `conftest.py` file is the heart of our testing infrastructure. It provides:

#### 1. Event Loop Management

```python
@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
```

- Session-scoped event loop for all async tests
- Ensures consistent async behavior across test suite
- Properly cleaned up after all tests complete

#### 2. Database Fixtures

**Test Engine** (`test_engine`):
- Creates separate test database (`{DB_NAME}_test`)
- Uses `NullPool` to avoid connection pooling issues
- Automatically creates/drops tables before/after tests
- Session-scoped for performance

**Session Maker** (`test_session_maker`):
- Function-scoped session factory
- Ensures each test gets fresh session maker

**DB Session** (`db_session`):
- Function-scoped database session
- Automatic rollback after each test for isolation
- Ensures clean state for every test

#### 3. FastAPI Client Fixture

**AsyncClient** (`client`):
- Overrides `get_db` dependency to use test database
- Uses ASGI transport for direct app testing
- Automatic cleanup after each test
- Base URL set to `http://test`

#### 4. Helper Fixtures

**User Data** (`user_data`, `user_data_2`):
- Provides valid user registration data
- Reusable across multiple tests

**Test User** (`test_user`):
- Creates and authenticates a user
- Returns user data with access token
- Ready for protected endpoint testing

**Auth Headers** (`auth_headers`):
- Provides formatted Authorization headers
- Simplifies protected endpoint testing

## Test Coverage

### Authentication Module (`test_auth.py`)

#### Signup Tests (`TestSignup`)

✅ **test_signup_success_with_valid_data**
- Valid user registration
- Returns 201 Created
- Returns complete user profile

✅ **test_signup_success_without_full_name**
- Registration with minimal required fields
- Optional fields handled correctly

✅ **test_signup_failure_with_duplicate_email**
- Duplicate email rejection
- Returns 400 Bad Request

✅ **test_signup_failure_with_invalid_email**
- Email validation
- Returns 422 Unprocessable Entity

✅ **test_signup_failure_with_short_password**
- Password length validation
- Returns 422 Unprocessable Entity

#### Login Tests (`TestLogin`)

✅ **test_login_success_with_valid_credentials**
- Successful authentication
- Returns valid JWT token
- Token contains correct user ID

✅ **test_login_failure_with_wrong_password**
- Password verification
- Returns 401 Unauthorized

✅ **test_login_failure_with_nonexistent_email**
- User existence check
- Returns 401 Unauthorized

✅ **test_login_failure_with_missing_credentials**
- Form validation
- Returns 422 Unprocessable Entity

#### Protected Endpoint Tests (`TestProtectedEndpoints`)

✅ **test_protected_endpoint_success_with_valid_token**
- JWT authentication success
- Returns user profile

✅ **test_protected_endpoint_failure_without_token**
- Anonymous access rejection
- Returns 403 Forbidden

✅ **test_protected_endpoint_failure_with_invalid_token**
- Invalid JWT rejection
- Returns 401 Unauthorized

✅ **test_protected_endpoint_failure_with_expired_token**
- Expired token rejection
- Returns 401 Unauthorized

✅ **test_protected_endpoint_failure_with_malformed_header**
- Authorization header format validation
- Returns 403 Forbidden

#### Integration Flow Tests (`TestAuthenticationFlow`)

✅ **test_complete_signup_login_access_flow**
- Complete user journey
- Signup → Login → Access protected resource
- Data consistency verification

## Running Tests

### Prerequisites

1. **Install Dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

2. **Ensure PostgreSQL is Running**:
```bash
# Using Docker Compose (recommended)
docker-compose up -d db

# Or check if PostgreSQL is running locally
pg_isready
```

3. **Create Test Database** (if not using automatic creation):
```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create test database
CREATE DATABASE driver_finance_db_test;
```

### Running All Tests

```bash
# Run all tests with verbose output
pytest

# Or explicitly specify the test directory
pytest tests/

# With coverage report (requires pytest-cov)
pytest --cov=app --cov-report=html
```

### Running Specific Test Suites

```bash
# Run only authentication tests
pytest tests/api/v1/test_auth.py

# Run specific test class
pytest tests/api/v1/test_auth.py::TestSignup

# Run specific test
pytest tests/api/v1/test_auth.py::TestSignup::test_signup_success_with_valid_data
```

### Running Tests with Different Output Levels

```bash
# Minimal output (only failures)
pytest -q

# Verbose output (default in pytest.ini)
pytest -v

# Very verbose (show all details)
pytest -vv

# Show print statements
pytest -s
```

### Running Tests by Marker

```bash
# Run only integration tests
pytest -m integration

# Run only async tests
pytest -m asyncio

# Exclude slow tests
pytest -m "not slow"
```

### Useful Test Options

```bash
# Stop at first failure
pytest -x

# Stop after N failures
pytest --maxfail=3

# Run last failed tests
pytest --lf

# Run failed tests first, then all others
pytest --ff

# Show local variables in tracebacks
pytest -l

# Capture only failed tests
pytest --tb=short
```

## Environment Variables

The test suite uses the same configuration as the main application but connects to a separate test database.

**Important Environment Variables**:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_SERVER=localhost  # Use localhost when running outside Docker
POSTGRES_PORT=5432
POSTGRES_DB=driver_finance_db  # Test DB will be driver_finance_db_test

# JWT Configuration (use different keys in production!)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Writing New Tests

### Best Practices

1. **Follow AAA Pattern** (Arrange-Act-Assert):
```python
async def test_example(client: AsyncClient) -> None:
    # Arrange: Set up test data
    user_data = {"email": "test@example.com", "password": "Password123!"}
    
    # Act: Execute the action
    response = await client.post("/api/v1/signup", json=user_data)
    
    # Assert: Verify the results
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]
```

2. **Use Type Hints**:
```python
async def test_example(
    client: AsyncClient, 
    user_data: dict[str, Any]
) -> None:
    ...
```

3. **Clear Test Names**:
- Use descriptive names that explain what's being tested
- Format: `test_<action>_<expected_outcome>_<condition>`
- Example: `test_signup_failure_with_duplicate_email`

4. **Comprehensive Documentation**:
- Add docstrings explaining scenario, arrange-act-assert steps
- Document expected behavior and edge cases

5. **Test Isolation**:
- Each test should be independent
- Use fixtures for setup/teardown
- Don't rely on test execution order

### Example Test Template

```python
@pytest.mark.asyncio
class TestNewFeature:
    """Test suite for new feature."""
    
    async def test_feature_success_with_valid_input(
        self, 
        client: AsyncClient, 
        test_user: dict[str, Any]
    ) -> None:
        """
        Test successful feature execution with valid input.
        
        Scenario:
        - User provides valid input
        - System processes request
        - Returns expected result
        
        Arrange:
            Valid input data and authenticated user
        Act:
            POST request to endpoint
        Assert:
            - Status code is 200
            - Response contains expected data
        """
        # Arrange
        input_data = {"field": "value"}
        headers = {"Authorization": f"Bearer {test_user['access_token']}"}
        
        # Act
        response = await client.post(
            "/api/v1/endpoint",
            json=input_data,
            headers=headers,
        )
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["field"] == input_data["field"]
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: driver_finance_db_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest -v
        env:
          POSTGRES_SERVER: localhost
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: driver_finance_db
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `asyncpg.exceptions.InvalidCatalogNameError: database "driver_finance_db_test" does not exist`

**Solution**: The test database is automatically created by the test fixtures. If you see this error, ensure PostgreSQL is running and accessible.

#### 2. Event Loop Errors

**Problem**: `RuntimeError: Task attached to a different loop`

**Solution**: Ensure you're using the session-scoped `event_loop` fixture provided in `conftest.py`.

#### 3. Import Errors

**Problem**: `ModuleNotFoundError: No module named 'pytest'`

**Solution**: Install test dependencies:
```bash
pip install -r requirements.txt
```

#### 4. Fixture Not Found

**Problem**: `fixture 'client' not found`

**Solution**: Ensure `conftest.py` is in the `tests/` directory. Pytest automatically discovers fixtures from `conftest.py` files.

#### 5. Tests Passing Locally but Failing in CI

**Problem**: Environment differences

**Solution**: 
- Check environment variables
- Ensure test database is accessible
- Verify PostgreSQL service is running
- Check for timing issues (add appropriate waits)

### Debug Mode

Run tests with debug output:

```bash
# Show all print statements and logging
pytest -s -v --log-cli-level=DEBUG

# Enable pytest internal debugging
pytest --debug

# Use pdb debugger on failures
pytest --pdb
```

## Test Metrics

### Current Coverage

- **Authentication Module**: 100% endpoint coverage
- **Test Cases**: 15 comprehensive integration tests
- **Test Scenarios**: Success paths, failure paths, edge cases

### Performance

- Average test suite execution: ~5-10 seconds
- Database setup/teardown: ~2 seconds
- Individual test: ~0.1-0.5 seconds

## Future Enhancements

### Recommended Additions

1. **Coverage Reporting**:
```bash
pip install pytest-cov
pytest --cov=app --cov-report=html --cov-report=term-missing
```

2. **Performance Testing**:
```bash
pip install pytest-benchmark
# Add benchmark tests for critical paths
```

3. **Load Testing**:
```bash
pip install locust
# Create load test scenarios
```

4. **Mutation Testing**:
```bash
pip install mutpy
# Verify test quality through mutation testing
```

5. **Security Testing**:
```bash
pip install bandit safety
# Add security vulnerability scanning
```

## Contributing

When adding new tests:

1. Follow the existing structure and patterns
2. Use the AAA pattern consistently
3. Add comprehensive docstrings
4. Ensure tests are isolated and idempotent
5. Update this README with new test coverage
6. Maintain type hints throughout

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [httpx Documentation](https://www.python-httpx.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy 2.0 Testing](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

