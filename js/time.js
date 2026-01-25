// ============================================
// HORA Y FECHA EN TIEMPO REAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const datetimeEl = document.getElementById('datetime');

    function updateDateTime() {
        if (!datetimeEl) return;

        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const day = now.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = months[now.getMonth()];
        const year = now.getFullYear();

        datetimeEl.textContent = `${hours}:${minutes} | ${day} ${month} ${year}`;
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);
});
