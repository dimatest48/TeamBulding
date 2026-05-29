FROM python:3.12-slim

WORKDIR /app

# System deps for building wheels (bcrypt, psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# psycopg for Postgres in compose
RUN pip install --no-cache-dir -r requirements.txt psycopg[binary]==3.2.3

COPY . .

# Run migrations, then start the API
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
