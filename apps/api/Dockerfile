# Build stage: Python 3.12 slim with uv
FROM python:3.12-slim-bookworm AS builder

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for ultra-fast, pinned Python dependency installation
COPY --from=ghcr.io/astral-sh/uv:0.6.5 /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency specifications first to leverage Docker layer caching
COPY pyproject.toml uv.lock ./

# Install project dependencies without installing root project package
RUN uv sync --frozen --no-dev --no-install-project


# Final production runtime stage
FROM python:3.12-slim-bookworm AS runner

# Install runtime dependencies only (libpq for postgresql, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy uv binaries
COPY --from=ghcr.io/astral-sh/uv:0.6.5 /uv /uvx /bin/

# Security: create non-root application user with home directory
RUN groupadd -r -g 1001 appuser && useradd -m -u 1001 -g appuser -s /bin/bash appuser

WORKDIR /app

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    UV_CACHE_DIR=/tmp/.uv-cache \
    UV_NO_SYNC=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod \
    PORT=8000

# Copy installed venv from builder
COPY --chown=appuser:appuser --from=builder /app/.venv /app/.venv

# Copy application source code
COPY --chown=appuser:appuser . /app/

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R appuser:appuser /app/staticfiles /app/media

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

CMD ["web"]
