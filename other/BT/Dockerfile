# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install curl for healthcheck and other system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories with world-writable permissions
RUN mkdir -p public/uploads && \
    chmod 777 public/uploads

# Expose port
EXPOSE 3000

# Run with gunicorn in production (as root to maintain permissions)
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "4", "--timeout", "120", "app:app"]
