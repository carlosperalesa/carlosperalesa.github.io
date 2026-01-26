FROM python:3.11-slim

# Información del mantenedor
LABEL maintainer="Carlos Perales <contact@carlosperales.dev>"
LABEL description="Contact API Backend for Portfolio"

# Directorio de trabajo
WORKDIR /app

# Copiar requirements y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear directorio para la base de datos
RUN mkdir -p data

# Create non-root user for security (Best Practice)
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 5000

# Variables de entorno por defecto
ENV PORT=5000
ENV FLASK_ENV=production

# Comando para ejecutar
CMD ["python", "app.py"]
