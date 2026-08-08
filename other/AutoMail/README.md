# ✉️ AutoMail - Generador de Correos desde XLSX

AutoMail es un sub-proyecto autónomo y backend en Python/Flask que procesa planillas de cálculo `.xlsx`, valida la integridad de los datos de terapeutas/transacciones, genera correos HTML individualizados y emite un informe de auditoría (`report.log`) junto a un paquete descargable (`mail_generados.zip`).

---

## 🛠️ Requisitos del Sistema

- **Python**: 3.10+
- **Dependencias**: Listadas en `requirements.txt` (`Flask`, `pandas`, `openpyxl`, `jinja2`, etc.)

---

## 🚀 Instalación y Configuración Local

1. Crear y activar entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/macOS
   # venv\Scripts\activate   # En Windows
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

---

## 💻 Uso en Línea de Comandos (CLI)

Ejecución estándar utilizando `base.xlsx`:
```bash
python generate_emails.py
```

Resultados producidos:
- Archivos HTML por terapeuta en `mails_generados/`
- Reporte de auditoría de conciliación en `report.log`
- Archivo comprimido final en `mail_generados.zip`

### Opciones y Parámetros CLI

```bash
python generate_emails.py --input base.xlsx --output-dir mails_generados --report-path report.log --zip-path mail_generados.zip
```

Parámetros adicionales:
- `--no-strict`: Permite continuar y generar correos aunque existan discrepancias o errores de integridad.
- `--tolerance`: Define el umbral de tolerancia para pequeñas diferencias monetarias o de redondeo (por defecto `2.0`).

---

## 🔍 Reglas de Validación y Conciliación

`generate_emails.py` realiza las siguientes comprobaciones:
- **Encabezados Dinámicos**: Lectura por nombres de columnas (evitando fallos por índices rígidos).
- **Conciliación de Montos por Terapeuta**:
  - Servicios (compara *CUADRO TERAPEUTAS* vs *Detalle Tps*)
  - Eventos (compara *CUADRO TERAPEUTAS* vs *Detalle para terapeutas*)
  - Incidencias (compara *CUADRO TERAPEUTAS* vs *Detalle para terapeutas*)
- **Detección de Huérfanos**: Identifica terapeutas presentes en las hojas de detalle que no existen en el cuadro general.

### Modo Estricto (`STRICT_MODE`)

- `STRICT_MODE = True`: Si se detectan inconsistencias graves durante la validación, el proceso se detiene y bloquea la generación de correos para evitar errores comerciales.
- `TOLERANCIA_MONTOS = 2.0`: Umbral aceptable para diferencias de decimales o redondeo.

---

## 🌐 Servicio Web y API HTTP (Flask)

El pipeline de generación se expone a la web mediante `server.py` (ejecutado por defecto en el puerto local `:8092`).

### Endpoints HTTP (`/automail-api/`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/automail-api/health` | Health Check del servicio backend AutoMail |
| `POST` | `/automail-api/jobs` | Recibe archivo `.xlsx`, crea un directorio de job temporal en `runtime/` y dispara `generate_emails.py` |
| `GET` | `/automail-api/jobs/<job_id>` | Estado actual del job (`queued`, `running`, `done`, `blocked`, `error`), mensaje y avance del `report.log` |
| `GET` | `/automail-api/jobs/<job_id>/report` | Descarga/consulta directa del archivo `report.log` |
| `GET` | `/automail-api/jobs/<job_id>/download` | Descarga directa del archivo comprimido `mail_generados.zip` |

---

## ⚙️ Despliegue e Integración en Servidor

### Servicio Systemd (`automail.service`)

El servicio corre de forma continua gestionado por systemd:
- **Unit file**: `automail.service` (ubicado en la raíz del repositorio y desplegado en `/etc/systemd/system/automail.service`)
- **Directorio de ejecuciones temporales**: `other/AutoMail/runtime/`

### Proxy Reverso (Nginx)

Nginx expone el servicio en producción bajo el path `/automail-api/`:

```nginx
location /automail-api/ {
    proxy_pass http://127.0.0.1:8092/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 25M;
}
```

### Automatización con `start.sh`

Al ejecutar `start.sh` en el servidor:
1. Se reinstalan o actualizan las dependencias de `requirements.txt`.
2. Se copian y recargan las unidades de systemd (`automail.service`).
3. Se otorgan permisos al directorio `runtime/`.
