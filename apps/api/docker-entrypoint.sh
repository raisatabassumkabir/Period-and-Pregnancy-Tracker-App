#!/bin/sh
set -e

# Helper to wait for postgres
wait_for_db() {
  echo "Checking PostgreSQL connection..."
  python - << 'EOF'
import os
import sys
import time
import dj_database_url
import psycopg

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    sys.exit(0)

cfg = dj_database_url.parse(db_url)
retries = 30
while retries > 0:
    try:
        conn = psycopg.connect(
            dbname=cfg["NAME"],
            user=cfg["USER"],
            password=cfg["PASSWORD"],
            host=cfg["HOST"],
            port=cfg.get("PORT", 5432),
            connect_timeout=3
        )
        conn.close()
        print("Connected to PostgreSQL successfully.")
        sys.exit(0)
    except Exception as exc:
        retries -= 1
        print(f"Waiting for database... ({retries} retries left): {exc}")
        time.sleep(2)

print("Could not connect to PostgreSQL in time.")
sys.exit(1)
EOF
}

if [ "$1" = "web" ]; then
  wait_for_db

  echo "Running database migrations..."
  uv run manage.py migrate --noinput

  echo "Collecting static files..."
  uv run manage.py collectstatic --noinput

  echo "Starting Gunicorn with Uvicorn ASGI workers..."
  exec uv run gunicorn config.asgi:application \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

elif [ "$1" = "worker" ]; then
  wait_for_db
  echo "Starting Celery worker..."
  exec uv run celery -A config worker -l "${CELERY_LOG_LEVEL:-info}" --concurrency="${CELERY_CONCURRENCY:-2}"

elif [ "$1" = "beat" ]; then
  wait_for_db
  echo "Starting Celery beat..."
  exec uv run celery -A config beat -l "${CELERY_LOG_LEVEL:-info}" -s /tmp/celerybeat-schedule

else
  exec "$@"
fi
