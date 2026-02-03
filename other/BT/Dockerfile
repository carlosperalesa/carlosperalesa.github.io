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

# Create non-root user for security FIRST
RUN useradd -m -u 1000 appuser

# Create necessary directories and set proper permissions
RUN mkdir -p public/uploads && \
    chown -R appuser:appuser /app && \
    chmod 755 /app && \
    chmod 755 /app/public && \
    chmod 777 /app/public/uploads

USER appuser

# Expose port
EXPOSE 3000

# Run with gunicorn in production
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "4", "--timeout", "120", "app:app"]
