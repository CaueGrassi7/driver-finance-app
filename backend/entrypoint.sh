#!/bin/sh
set -euo pipefail

# Apply database migrations before starting the app
alembic upgrade head

# Run the API server
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
