// ============================================
// PROTON PASS - GESTOR DE DUPLICADOS
// Herramienta para revisar y limpiar contraseñas duplicadas
// ============================================

// ============================================
// VARIABLES GLOBALES
// ============================================
let entries = [];
let groups = [];
let expandedGroups = new Set();
const entryMap = new Map();
const groupIdMap = new Map();
let groupIdCounter = 0;
let fileHeaders = [];

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const uploadSection = document.getElementById('uploadSection');
const reviewSection = document.getElementById('reviewSection');
const doneSection = document.getElementById('doneSection');
const fileInput = document.getElementById('fileInput');
const groupsContainer = document.getElementById('groupsContainer');
const cancelBtn = document.getElementById('cancelBtn');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');

// ============================================
// EVENT LISTENERS
// ============================================
fileInput.addEventListener('change', handleFileUpload);
cancelBtn.addEventListener('click', reset);
exportBtn.addEventListener('click', exportClean);
resetBtn.addEventListener('click', reset);

// ============================================
// CARGA Y PROCESAMIENTO DE ARCHIVO
// ============================================
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        resetStateForNewFile();

        const rows = parseCSV(stripBOM(text));
        if (!rows.length) {
            alert('El archivo está vacío.');
            return;
        }

        fileHeaders = rows[0].map((header) => header.trim());
        if (!fileHeaders.length) {
            alert('El archivo CSV no contiene encabezados.');
            return;
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row.some(hasContent)) continue;

            const entry = { keep: true };
            fileHeaders.forEach((header, idx) => {
                entry[header] = row[idx] !== undefined ? row[idx] : '';
            });

            const hasKeyData = ['name', 'url', 'username', 'email'].some((key) => hasContent(entry[key]));
            if (!hasKeyData) continue;

            entry.id = `entry-${entries.length}`;
            entries.push(entry);
            entryMap.set(entry.id, entry);
        }

        if (!entries.length) {
            alert('No se encontraron entradas válidas en el archivo.');
            return;
        }

        groupEntries();
        uploadSection.classList.add('hidden');
        reviewSection.classList.remove('hidden');
        renderGroups();
    } catch (error) {
        console.error(error);
        alert('Error al leer el archivo. Asegúrate de que sea un CSV válido.');
    }
}

// ============================================
// AGRUPACIÓN DE ENTRADAS
// ============================================
function groupEntries() {
    const grouped = new Map();

    entries.forEach((entry) => {
        const keyCandidate = entry.name || entry.url || 'Sin nombre';
        const key = (keyCandidate || 'Sin nombre').trim() || 'Sin nombre';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(entry);
    });

    groups = Array.from(grouped.entries())
        .map(([name, items]) => {
            let id = groupIdMap.get(name);
            if (!id) {
                id = `group-${groupIdCounter++}`;
                groupIdMap.set(name, id);
            }

            return {
                id,
                name,
                items,
                count: items.length,
                hasPossibleDuplicates: checkPossibleDuplicates(items)
            };
        })
        .sort((a, b) => b.count - a.count);
}

// ============================================
// DETECCIÓN DE DUPLICADOS
// ============================================
function checkPossibleDuplicates(items) {
    if (items.length <= 1) return false;
    const usernames = items.map(i => (i.username || i.email || '').toLowerCase().trim());
    const uniqueUsernames = new Set(usernames.filter(u => u));
    return uniqueUsernames.size < items.length;
}

// ============================================
// ORDENAMIENTO
// ============================================
function handleSort() {
    groups.sort((a, b) => b.count - a.count);
    renderGroups();
}

// ============================================
// RENDERIZADO DE GRUPOS
// ============================================
function renderGroups() {
    updateCounts();

    let html = '';

    groups.forEach((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const canSelectSingle = group.items.length > 1;
        const sortedItems = [...group.items].sort((a, b) => {
            const userA = (a.username || a.email || '').toLowerCase();
            const userB = (b.username || b.email || '').toLowerCase();
            return userA.localeCompare(userB);
        });

        const itemsHtml = sortedItems
            .map((entry) => {
                const modifyDate = formatTimestamp(entry.modifyTime);

                return `
                    <div class="entry-card" style="opacity: ${entry.keep ? '1' : '0.6'}">
                        <div class="entry-card-left">
                            <p class="entry-card-title">${escapeHtml(entry.username || entry.email || '(sin usuario)')}</p>
                            ${modifyDate ? `<p class="entry-card-subtitle">Última modificación: ${escapeHtml(modifyDate)}</p>` : ''}
                        </div>
                        <div class="details-section">
                            <div class="detail-row">
                                <span class="detail-label">Usuario:</span>
                                <span class="detail-value">${escapeHtml(entry.username || entry.email || '(sin usuario)')}</span>
                            </div>
                            ${entry.url ? `<div class="detail-row">
                                <span class="detail-label">URL:</span>
                                <span class="detail-value" style="color: #2563eb;">${escapeHtml(entry.url)}</span>
                            </div>` : ''}
                            <div class="detail-row">
                                <span class="detail-label">Contraseña:</span>
                                <span class="detail-value" style="font-family: monospace;">${escapeHtml(entry.password || '(vacía)')}</span>
                            </div>
                            ${entry.note ? `<div class="detail-row">
                                <span class="detail-label">Nota:</span>
                                <span class="detail-value" style="color: #6b7280;">${escapeHtml(entry.note)}</span>
                            </div>` : ''}
                        </div>
                        <div class="action-buttons">
                            <button onclick="toggleKeep('${entry.id}', event)" class="btn ${entry.keep ? 'btn-primary-action' : 'btn-primary-keep'} toggle-btn">
                                ${entry.keep ? 'Eliminar' : 'Mantener'}
                            </button>
                            ${canSelectSingle ? `<button onclick="keepOnlyThis('${group.id}', '${entry.id}')" class="btn btn-secondary">Solo esta</button>` : ''}
                        </div>
                    </div>
                `;
            })
            .join('');

        html += `
            <div class="service-group">
                <div class="service-header" onclick="toggleGroup('${group.id}')">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg class="expand-icon" id="icon-${group.id}" style="width: 1.25rem; height: 1.25rem; transition: transform 0.3s ease; transform: rotate(${isExpanded ? '90deg' : '0deg'});" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        <span class="service-title">${escapeHtml(group.name)}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="service-count">${group.count} entradas</span>
                        <button onclick="event.stopPropagation(); deleteAllInGroup('${group.id}')" class="btn btn-danger">Eliminar todas</button>
                    </div>
                </div>
                <div id="group-${group.id}" class="${isExpanded ? '' : 'hidden'}" style="margin-top: 0.5rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${itemsHtml}
                    </div>
                </div>
            </div>
        `;
    });

    groupsContainer.innerHTML = html;
}

// ============================================
// TOGGLE DE GRUPOS
// ============================================
function toggleGroup(groupId) {
    const element = document.getElementById(`group-${groupId}`);
    const icon = document.getElementById(`icon-${groupId}`);
    if (!element) return;

    const willExpand = element.classList.contains('hidden');
    if (willExpand) {
        element.classList.remove('hidden');
        expandedGroups.add(groupId);
    } else {
        element.classList.add('hidden');
        expandedGroups.delete(groupId);
    }

    if (icon) {
        icon.style.transform = willExpand ? 'rotate(90deg)' : 'rotate(0deg)';
    }
}

// ============================================
// GESTIÓN DE ENTRADAS
// ============================================
function toggleKeep(entryId, evt) {
    const entry = entryMap.get(entryId);
    if (!entry) return;

    entry.keep = !entry.keep;

    if (evt) {
        const button = evt.currentTarget || evt.target;
        const card = button.closest('.entry-card');

        button.textContent = entry.keep ? 'Eliminar' : 'Mantener';
        button.className = `btn ${entry.keep ? 'btn-primary-action' : 'btn-primary-keep'} toggle-btn`;
        if (card) {
            card.style.opacity = entry.keep ? '1' : '0.6';
        }
    }

    updateCounts();
}

function keepOnlyThis(groupId, entryId) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    group.items.forEach((item) => {
        item.keep = item.id === entryId;
    });

    renderGroups();
}

function deleteAllInGroup(groupId) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    group.items.forEach((item) => {
        item.keep = false;
    });

    renderGroups();
}

// ============================================
// ACTUALIZACIÓN DE CONTADORES
// ============================================
function updateCounts() {
    document.getElementById('totalCount').textContent = entries.length;
    document.getElementById('servicesCount').textContent = groups.length;
    document.getElementById('keepCount').textContent = entries.filter(e => e.keep).length;
    document.getElementById('removeCount').textContent = entries.filter(e => !e.keep).length;
}

// ============================================
// EXPORTACIÓN
// ============================================
function exportClean() {
    if (!entries.length) {
        alert('No hay datos cargados. Carga un archivo primero.');
        return;
    }

    const kept = entries.filter((entry) => entry.keep);
    if (!kept.length) {
        alert('No hay entradas marcadas para mantener.');
        return;
    }

    let headers = fileHeaders.slice();
    if (!headers.length) {
        headers = Object.keys(kept[0]).filter((key) => key !== 'keep' && key !== 'id');
    }

    const rows = [headers];
    kept.forEach((entry) => {
        rows.push(headers.map((header) => (entry[header] !== undefined ? entry[header] : '')));
    });

    const csvContent = serializeCSV(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proton-pass-limpio.csv';
    a.click();
    URL.revokeObjectURL(url);

    reviewSection.classList.add('hidden');
    doneSection.classList.remove('hidden');
}

// ============================================
// RESET
// ============================================
function reset() {
    resetStateForNewFile();
    fileInput.value = '';
    uploadSection.classList.remove('hidden');
    reviewSection.classList.add('hidden');
    doneSection.classList.add('hidden');
}

function resetStateForNewFile() {
    entries = [];
    groups = [];
    fileHeaders = [];
    expandedGroups.clear();
    entryMap.clear();
    groupIdMap.clear();
    groupIdCounter = 0;
    groupsContainer.innerHTML = '';
    updateCounts();
}

function stripBOM(text) {
    if (!text) return '';
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Parser sencillo para CSV que respeta comillas y nuevas líneas embebidas.
function parseCSV(text) {
    const rows = [];
    let current = '';
    let row = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(current);
            current = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            row.push(current);
            current = '';
            if (row.length) rows.push(row);
            row = [];
            if (char === '\r' && text[i + 1] === '\n') {
                i += 1;
            }
        } else {
            current += char;
        }
    }

    if (current.length || row.length) {
        row.push(current);
        rows.push(row);
    }

    return rows;
}

function serializeCSV(rows) {
    return rows
        .map((row) =>
            row
                .map((value) => {
                    const stringValue = value === undefined || value === null ? '' : String(value);
                    if (/[",\r\n]/.test(stringValue)) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                .join(',')
        )
        .join('\r\n');
}

function hasContent(value) {
    return value !== undefined && value !== null && String(value).trim() !== '';
}

function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatTimestamp(value) {
    if (!value) return '';
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return '';
    const date = new Date(seconds * 1000);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
}
