# AutoMail

Genera un HTML por terapeuta a partir de `base.xlsx` y valida integridad de datos antes de generar.

## Requisitos

- Python 3.10+
- Dependencias en `requirements.txt`

## Instalación

1. Crear y activar entorno virtual.
2. Instalar dependencias:

   `pip install -r requirements.txt`

## Uso

Ejecutar:

`python generate_emails.py`

Salida:

- HTML por terapeuta en `mails_generados/`
- Reporte de auditoría en `report.log`
- ZIP con los HTML generados en `mail_generados.zip`

### Modo CLI con parámetros

```bash
python generate_emails.py --input base.xlsx --output-dir mails_generados --report-path report.log --zip-path mail_generados.zip
```

Parámetros útiles:

- `--no-strict`: permite continuar aunque existan errores de integridad.
- `--tolerance`: ajusta la tolerancia de diferencias monetarias.

### Uso web

El mismo pipeline se expone ahora en [server.py](server.py) para el modal AutoMail del portafolio.

- `POST /jobs`: sube el XLSX y crea un job temporal.
- `GET /jobs/<id>`: devuelve estado, mensaje y contenido de `report.log`.
- `GET /jobs/<id>/report`: lee el log directo.
- `GET /jobs/<id>/download`: descarga `mail_generados.zip`.

## Qué valida

- Lectura robusta por encabezados (no por índice fijo de columnas).
- Conciliación de montos por terapeuta:
  - Servicios (CUADRO TERAPEUTAS vs Detalle Tps)
  - Eventos (CUADRO TERAPEUTAS vs Detalle para terapeutas)
  - Incidencias (CUADRO TERAPEUTAS vs Detalle para terapeutas)
- Terapeutas con movimientos en detalle que no existen en cuadro.

## Modo estricto

En `generate_emails.py`:

- `STRICT_MODE = True`: si hay errores de integridad, se bloquea la generación.
- `TOLERANCIA_MONTOS = 2.0`: umbral permitido para diferencias de redondeo.

## report.log

Incluye:

- estado de ejecución
- cantidad de errores y advertencias
- resumen de filas leídas
- conciliación por terapeuta con diferencia (delta) en servicios, eventos e incidencias
