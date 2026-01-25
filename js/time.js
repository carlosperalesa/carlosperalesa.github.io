// ============================================
// HORA Y FECHA EN TIEMPO REAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const datetimeEl = document.getElementById('datetime');

    function updateDateTime() {
        if (!datetimeEl) return;

        const now = new Date();

        // Use Intl for cleaner formatting
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };

        const timeStr = now.toLocaleTimeString('es-CL', timeOptions);
        const dateStr = now.toLocaleDateString('es-CL', dateOptions);

        // Remove dots from month (Ene. -> Ene) if browser adds them, for consistency
        const cleanDateStr = dateStr.replace('.', '');

        datetimeEl.textContent = `${timeStr} | ${cleanDateStr}`;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
});
