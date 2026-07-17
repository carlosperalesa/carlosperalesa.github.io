from __future__ import annotations

import shutil
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from werkzeug.utils import secure_filename

from generate_emails import run_autemail_pipeline

BASE_DIR = Path(__file__).resolve().parent
RUNTIME_DIR = BASE_DIR / 'runtime'
JOBS_DIR = RUNTIME_DIR / 'jobs'
MAX_UPLOAD_SIZE = 25 * 1024 * 1024
ALLOWED_EXTENSIONS = {'.xlsx'}

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE + 1024 * 1024

jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def ensure_runtime_dirs() -> None:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def set_job(job_id: str, **updates) -> dict:
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise KeyError(job_id)
        job.update(updates)
        job['updated_at'] = now_iso()
        return job.copy()


def get_job(job_id: str) -> dict | None:
    with jobs_lock:
        job = jobs.get(job_id)
        return job.copy() if job else None


def make_job() -> dict:
    job_id = uuid.uuid4().hex[:12]
    job_dir = JOBS_DIR / job_id
    output_dir = job_dir / 'mails_generados'
    report_path = job_dir / 'report.log'
    zip_path = job_dir / 'mail_generados.zip'

    job = {
        'id': job_id,
        'status': 'queued',
        'message': 'Archivo recibido. Preparando ejecución...',
        'created_at': now_iso(),
        'updated_at': now_iso(),
        'job_dir': str(job_dir),
        'input_path': str(job_dir / 'source.xlsx'),
        'output_dir': str(output_dir),
        'report_path': str(report_path),
        'zip_path': str(zip_path),
        'report_text': '',
        'download_url': None,
        'report_url': None,
        'source_name': '',
        'original_name': '',
        'error': None,
    }

    with jobs_lock:
        jobs[job_id] = job

    job_dir.mkdir(parents=True, exist_ok=True)
    return job.copy()


def cleanup_job_artifacts(job: dict) -> None:
    job_dir = Path(job['job_dir'])
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)


def run_job(job_id: str) -> None:
    job = get_job(job_id)
    if not job:
        return

    try:
        set_job(job_id, status='running', message='Ejecutando validación y generación...')
        result = run_autemail_pipeline(
            file_path=job['input_path'],
            output_dir=job['output_dir'],
            report_path=job['report_path'],
            zip_path=job['zip_path'],
            strict_mode=True,
            tolerancia_montos=2.0,
        )

        report_text = ''
        report_path = Path(job['report_path'])
        if report_path.exists():
            report_text = report_path.read_text(encoding='utf-8')

        if result['status'] == 'blocked':
            set_job(
                job_id,
                status='blocked',
                message='AutoMail detectó diferencias de integridad y no generó correos.',
                report_text=report_text,
                download_url=None,
                report_url=f'/jobs/{job_id}/report',
            )
            return

        warning_text = ''
        if result.get('warnings'):
            warning_text = f' Procesado con {len(result["warnings"])} advertencias.'

        set_job(
            job_id,
            status='done',
            message=f'Proceso completado correctamente.{warning_text}',
            report_text=report_text,
            download_url=f'/jobs/{job_id}/download',
            report_url=f'/jobs/{job_id}/report',
        )
    except Exception as exc:  # pragma: no cover - surfaced to UI
        report_text = ''
        report_path = Path(job['report_path'])
        if report_path.exists():
            try:
                report_text = report_path.read_text(encoding='utf-8')
            except Exception:
                report_text = ''

        set_job(
            job_id,
            status='error',
            message='No fue posible completar la ejecución.',
            error=str(exc),
            report_text=report_text,
            download_url=None,
            report_url=f'/jobs/{job_id}/report',
        )


@app.get('/health')
def health():
    return jsonify({'ok': True, 'service': 'automail'}), 200


@app.post('/jobs')
def create_job():
    ensure_runtime_dirs()
    incoming = request.files.get('file')
    if not incoming or not incoming.filename:
        return jsonify({'error': 'Debes subir un archivo .xlsx.'}), 400

    if not allowed_file(incoming.filename):
        return jsonify({'error': 'Solo se aceptan archivos .xlsx.'}), 400

    safe_name = secure_filename(incoming.filename) or 'upload.xlsx'
    job = make_job()
    job_dir = Path(job['job_dir'])
    destination = Path(job['input_path'])

    incoming.save(destination)
    set_job(
        job['id'],
        status='queued',
        message='Archivo cargado. La ejecución comenzará en breve.',
        source_name=safe_name,
        original_name=incoming.filename,
    )

    worker = threading.Thread(target=run_job, args=(job['id'],), daemon=True)
    worker.start()

    return jsonify({
        'job_id': job['id'],
        'status': 'queued',
        'message': 'Archivo recibido. AutoMail está preparando la ejecución.',
        'status_url': f'/jobs/{job["id"]}',
    }), 202


@app.get('/jobs/<job_id>')
def job_status(job_id: str):
    job = get_job(job_id)
    if not job:
        return jsonify({'error': 'Trabajo no encontrado.'}), 404

    payload = {
        'job_id': job['id'],
        'status': job['status'],
        'message': job['message'],
        'report_text': job.get('report_text') or '',
        'download_url': job.get('download_url'),
        'report_url': job.get('report_url'),
        'error': job.get('error'),
        'created_at': job.get('created_at'),
        'updated_at': job.get('updated_at'),
        'source_name': job.get('source_name'),
    }
    return jsonify(payload), 200


@app.get('/jobs/<job_id>/report')
def job_report(job_id: str):
    job = get_job(job_id)
    if not job:
        return jsonify({'error': 'Trabajo no encontrado.'}), 404

    report_path = Path(job['report_path'])
    if not report_path.exists():
        return jsonify({'error': 'El reporte aún no está disponible.'}), 404

    return send_file(report_path, as_attachment=False, mimetype='text/plain; charset=utf-8')


@app.get('/jobs/<job_id>/download')
def job_download(job_id: str):
    job = get_job(job_id)
    if not job:
        return jsonify({'error': 'Trabajo no encontrado.'}), 404

    zip_path = Path(job['zip_path'])
    if not zip_path.exists():
        return jsonify({'error': 'El ZIP aún no está disponible.'}), 404

    return send_file(zip_path, as_attachment=True, download_name='mail_generados.zip')


if __name__ == '__main__':
    ensure_runtime_dirs()
    app.run(host='127.0.0.1', port=8092, debug=False, threaded=True)
