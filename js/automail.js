document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-automail');
    if (!modal) return;

    const dropzone = document.getElementById('automail-dropzone');
    const fileInput = document.getElementById('automail-file-input');
    const fileName = document.getElementById('automail-file-name');
    const fileSize = document.getElementById('automail-file-size');
    const resetBtn = document.getElementById('automail-reset-btn');
    const sampleBtn = document.getElementById('automail-sample-btn');
    const runBtn = document.getElementById('automail-run-btn');
    const copyBtn = document.getElementById('automail-copy-btn');
    const reportOutput = document.getElementById('automail-report-output');
    const statusBadge = document.getElementById('automail-status-badge');
    const statusDetail = document.getElementById('automail-status-detail');
    const progressFill = document.getElementById('automail-progress-fill');
    const downloadLink = document.getElementById('automail-download-link');
    const infoLink = document.getElementById('cf-link');

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    const baseUrl = App.automail.getBaseUrl();

    let selectedFile = null;
    let currentJobId = null;
    let pollTimer = null;

    const sampleReport = [
        'AutoMail listo.',
        '',
        'Sube un archivo .xlsx para ejecutar la validación, generar los correos y producir el report.log.',
        '',
        'El resultado se mostrará aquí una vez terminado el procesamiento.'
    ].join('\n');

    function formatBytes(bytes) {
        if (!bytes && bytes !== 0) return '-';
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }

        return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    }

    function setStatus(type, title, message) {
        statusBadge.className = `automail-status-badge ${type}`;
        statusBadge.textContent = title;
        statusDetail.textContent = message;
    }

    function setProgress(state) {
        progressFill.classList.remove('is-working', 'is-done');
        progressFill.style.width = '0%';

        if (state === 'working') {
            progressFill.classList.add('is-working');
        } else if (state === 'done') {
            progressFill.classList.add('is-done');
        }
    }

    function renderReport(text) {
        reportOutput.textContent = text || 'Sin contenido de report.log.';
    }

    async function parseJsonResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            return await response.json();
        }

        const text = await response.text();
        return {
            error: text.slice(0, 500) || 'Respuesta inesperada del servidor.',
        };
    }

    function clearDownload() {
        downloadLink.style.display = 'none';
        downloadLink.href = '#';
    }

    function updateFilePreview(file) {
        if (!file) {
            fileName.textContent = 'Ninguno';
            fileSize.textContent = '-';
            selectedFile = null;
            return;
        }

        fileName.textContent = file.name;
        fileSize.textContent = formatBytes(file.size);
        selectedFile = file;
    }

    function clearState() {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }

        currentJobId = null;
        updateFilePreview(null);
        setStatus('idle', 'Esperando archivo', 'Selecciona un XLSX para comenzar.');
        setProgress('idle');
        renderReport(sampleReport);
        clearDownload();
        fileInput.value = '';
        dropzone.classList.remove('is-dragover');
    }

    function showToast(message, type = 'success') {
        const toast = document.getElementById('welcomeToast');
        if (!toast) return;

        toast.textContent = message;
        toast.style.background = type === 'success'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    function validateFile(file) {
        if (!file) return 'Selecciona un archivo .xlsx.';
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            return 'Solo se permiten archivos .xlsx.';
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'El archivo supera el límite de 25 MB.';
        }
        return '';
    }

    function setProcessingState(isProcessing) {
        runBtn.disabled = isProcessing;
        resetBtn.disabled = isProcessing;
        sampleBtn.disabled = isProcessing;
        copyBtn.disabled = isProcessing;
        fileInput.disabled = isProcessing;
        dropzone.style.pointerEvents = isProcessing ? 'none' : 'auto';
        runBtn.textContent = isProcessing ? 'Procesando...' : 'Procesar archivo';
    }

    async function pollJob() {
        if (!currentJobId) return;

        try {
            const response = await fetch(`${baseUrl}/jobs/${currentJobId}`);
            const data = await parseJsonResponse(response);

            if (!response.ok) {
                throw new Error(data.error || 'No fue posible consultar el estado del trabajo.');
            }

            if (data.status === 'queued' || data.status === 'running') {
                setStatus('running', 'Procesando', data.message || 'AutoMail sigue ejecutándose...');
                setProgress('working');
                reportOutput.textContent = data.report_text || reportOutput.textContent;
                pollTimer = setTimeout(pollJob, 1500);
                return;
            }

            if (data.report_text) {
                renderReport(data.report_text);
            }

            if (data.download_url) {
                downloadLink.href = `${baseUrl}${data.download_url}`;
                downloadLink.style.display = 'inline-flex';
            }

            if (data.status === 'done') {
                setStatus('success', 'Listo', data.message || 'La generación terminó correctamente.');
                setProgress('done');
                showToast('AutoMail terminó correctamente', 'success');
            } else if (data.status === 'blocked') {
                setStatus('warning', 'Revisar datos', data.message || 'Se encontraron errores de integridad y no se generaron correos.');
                setProgress('done');
                showToast('AutoMail detectó inconsistencias en el archivo', 'error');
            } else {
                setStatus('error', 'Error', data.message || 'Ocurrió un error durante la ejecución.');
                setProgress('idle');
                showToast('No se pudo completar AutoMail', 'error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error', 'Error', error.message || 'Error desconocido.');
            setProgress('idle');
            showToast('Error al consultar el trabajo de AutoMail', 'error');
        } finally {
            setProcessingState(false);
            if (pollTimer) {
                clearTimeout(pollTimer);
                pollTimer = null;
            }
        }
    }

    async function startJob() {
        if (!selectedFile) {
            showToast('Debes seleccionar un archivo .xlsx', 'error');
            return;
        }

        const validationError = validateFile(selectedFile);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setProcessingState(true);
            setStatus('running', 'Subiendo', 'El archivo se está cargando y preparando para ejecutar AutoMail.');
            setProgress('working');
            renderReport('Procesando archivo...');
            clearDownload();

            const response = await fetch(`${baseUrl}/jobs`, {
                method: 'POST',
                body: formData
            });

            const data = await parseJsonResponse(response);
            if (!response.ok) {
                throw new Error(data.error || 'No se pudo iniciar el procesamiento.');
            }

            currentJobId = data.job_id;
            setStatus('running', 'Procesando', data.message || 'AutoMail ya está ejecutándose.');
            pollTimer = setTimeout(pollJob, 1000);
        } catch (error) {
            console.error(error);
            setStatus('error', 'Error', error.message || 'No se pudo iniciar AutoMail.');
            setProgress('idle');
            setProcessingState(false);
            showToast(error.message || 'No se pudo iniciar AutoMail', 'error');
        }
    }

    function openAutomailModal() {
        clearState();
        if (typeof openModal === 'function') {
            openModal('automail');
        }
    }

    function copyReport() {
        const text = reportOutput.textContent || '';
        navigator.clipboard.writeText(text)
            .then(() => showToast('Reporte copiado al portapapeles', 'success'))
            .catch(() => showToast('No se pudo copiar el reporte', 'error'));
    }

    function showSampleHelp() {
        renderReport([
            'AutoMail - Ayuda rápida',
            '',
            '1. Sube un archivo .xlsx válido.',
            '2. El sistema lo valida y ejecuta generate_emails.py.',
            '3. El report.log se mostrará en esta sección.',
            '4. Si el proceso termina bien, podrás descargar mail_generados.zip.',
            '',
            'Notas:',
            '- El archivo debe mantener las hojas esperadas por AutoMail.',
            '- Si hay diferencias de conciliación, el sistema las reportará antes de generar.'
        ].join('\n'));
        setStatus('idle', 'Ayuda', 'Revisa el flujo antes de subir un archivo nuevo.');
    }

    function handleFile(file) {
        const validationError = validateFile(file);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        updateFilePreview(file);
        setStatus('idle', 'Archivo listo', `${file.name} preparado para procesar.`);
        setProgress('idle');
        renderReport(sampleReport);
        clearDownload();
    }

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (file) handleFile(file);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.remove('is-dragover');
        });
    });

    dropzone.addEventListener('drop', (event) => {
        const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
        if (!file) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        handleFile(file);
    });

    runBtn.addEventListener('click', startJob);
    resetBtn.addEventListener('click', clearState);
    copyBtn.addEventListener('click', copyReport);
    sampleBtn.addEventListener('click', showSampleHelp);

    if (infoLink) {
        infoLink.addEventListener('click', (event) => {
            if (infoLink.dataset.action === 'open-automail') {
                event.preventDefault();
                openAutomailModal();
            }
        });
    }

    window.openAutoMailModal = openAutomailModal;

    clearState();
});
