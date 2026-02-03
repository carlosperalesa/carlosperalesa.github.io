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

# Create necessary directories BEFORE changing ownership
RUN mkdir -p public/uploads

# Set proper permissions on directories (as root, before changing user)
RUN chmod -R 755 public && \
    chmod -R 777 public/uploads && \
    chmod -R 666 public/uploads/* 2>/dev/null || true

# Create non-root user for security
RUN useradd -m -u 1000 appuser

# Change ownership to appuser
RUN chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 3000

# Run with gunicorn in production
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--workers", "4", "--timeout", "120", "app:app"]
