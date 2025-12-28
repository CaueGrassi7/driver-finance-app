# Testing Infrastructure

## 📋 Overview

This directory contains the testing infrastructure for the Driver Finance App backend.

## 🏗️ Structure

```
tests/
├── __init__.py                 # Package marker
├── conftest.py                 # Test configuration and fixtures
├── test_example.py            # Example tests (replace with your tests)
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_example.py

# Run specific test
pytest tests/test_example.py::test_example_placeholder
```

## 🔧 Available Fixtures

The `conftest.py` file provides several fixtures for testing:

### Database Fixtures

- `test_engine`: Async database engine for testing
- `test_session_maker`: Session maker for test database
- `db_session`: Database session with automatic rollback

### HTTP Client Fixture

- `client`: AsyncClient for testing FastAPI endpoints

### Helper Fixtures

- `user_data`: Sample user data for testing
- `user_data_2`: Alternative user data

## 📝 Writing New Tests

### Example Test Structure

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestYourFeature:
    """Test suite for your feature."""

    async def test_your_endpoint(self, client: AsyncClient) -> None:
        """
        Test description.

        Arrange:
            Setup test data
        Act:
            Execute the action
        Assert:
            Verify the results
        """
        # Arrange
        test_data = {"key": "value"}

        # Act
        response = await client.post("/your/endpoint", json=test_data)

        # Assert
        assert response.status_code == 200
```

## 🎯 Best Practices

1. **Follow AAA Pattern**: Arrange-Act-Assert
2. **Use Type Hints**: All functions should have type annotations
3. **Descriptive Names**: Test names should clearly describe what they test
4. **One Assertion Per Test**: Keep tests focused
5. **Use Fixtures**: Leverage existing fixtures for common setup

## 📊 Test Configuration

### pytest.ini

The `pytest.ini` file configures:

- Test discovery patterns
- Asyncio mode
- Output formatting
- Custom markers

### Environment Variables

Set these before running tests:

```bash
# For Docker PostgreSQL
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_PORT=5433
export POSTGRES_SERVER=localhost

# Or for local PostgreSQL
export POSTGRES_SERVER=localhost
export POSTGRES_PORT=5432
```

## 🔍 Common Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run only specific marker
pytest -m integration

# Show print statements
pytest -s

# Stop at first failure
pytest -x

# Run last failed tests
pytest --lf
```

## 📚 Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [httpx Documentation](https://www.python-httpx.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## ✅ Next Steps

1. Replace `test_example.py` with your actual tests
2. Add test files as needed (e.g., `test_users.py`, `test_finance.py`)
3. Expand fixtures in `conftest.py` as needed
4. Keep tests organized by feature/module
