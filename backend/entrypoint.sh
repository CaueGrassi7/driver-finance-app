#!/bin/sh
set -euo pipefail

# Apply database migrations before starting the app
alembic upgrade head

# Run the API server
# Use --reload only in development for better performance in production
RELOAD_FLAG=""
if [ "${ENVIRONMENT:-production}" = "development" ]; then
    echo "🔧 Running in DEVELOPMENT mode with auto-reload"
    RELOAD_FLAG="--reload"
else
    echo "🚀 Running in PRODUCTION mode with multiple workers"
    RELOAD_FLAG="--workers 4"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 $RELOAD_FLAG
