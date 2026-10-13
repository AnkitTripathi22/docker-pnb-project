# 1. Official lightweight Python image
FROM python:3.11-slim

# 2. Container working directory
WORKDIR /app

# 3. Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 4. Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy backend source code
COPY . .

# 6. Expose default port (Render will bind to $PORT dynamically)
EXPOSE 8000

# 7. Production Uvicorn Server (Handles dynamic Render $PORT, no dev --reload)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
