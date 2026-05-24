// script.js - Lógica completa de la aplicación

let currentData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;  // Para vista de una columna es cómodo 10 por página

// Elementos DOM
const categoryFilter = document.getElementById('categoryFilter');
const typeFilter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchInput');
const resetBtn = document.getElementById('resetFiltersBtn');
const resultsContainer = document.getElementById('resultsContainer');
const paginationDiv = document.getElementById('paginationControls');
const statsSpan = document.getElementById('statsCount');
const jsonUpload = document.getElementById('jsonUpload');
const downloadBtn = document.getElementById('downloadJsonBtn');
const resetDefaultBtn = document.getElementById('resetDefaultData');
const toastEl = document.getElementById('toastMsg');

let toastTimeout = null;

function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastEl.textContent = message || "📋 Copiado al portapapeles";
    toastEl.style.opacity = '1';
    toastTimeout = setTimeout(() => {
        toastEl.style.opacity = '0';
    }, 2000);
}

function copyToClipboard(text, typeName) {
    const fullText = `【${typeName}】\n${text}`;
    navigator.clipboard.writeText(fullText)
        .then(() => showToast(`✅ Copiado: ${typeName.substring(0, 50)}`))
        .catch(() => showToast("❌ Error al copiar"));
}

// Actualizar opciones de tipo según categoría seleccionada
function updateTypeOptions() {
    const selectedCategory = categoryFilter.value;
    let availableTypes = [];
    if (selectedCategory === 'all') {
        availableTypes = [...new Set(currentData.map(item => item.type).filter(Boolean))];
    } else {
        availableTypes = [...new Set(currentData.filter(item => item.category === selectedCategory).map(item => item.type).filter(Boolean))];
    }
    const currentTypeValue = typeFilter.value;
    typeFilter.innerHTML = '<option value="all">Todos los tipos</option>';
    availableTypes.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        typeFilter.appendChild(option);
    });
    if (currentTypeValue !== 'all' && availableTypes.includes(currentTypeValue)) {
        typeFilter.value = currentTypeValue;
    } else {
        typeFilter.value = 'all';
    }
}

function populateFilters() {
    const categories = [...new Set(currentData.map(item => item.category).filter(Boolean))];
    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    updateTypeOptions();
}

function applyFilters() {
    const categoryVal = categoryFilter.value;
    const typeVal = typeFilter.value;
    const searchVal = searchInput.value.trim().toLowerCase();

    filteredData = currentData.filter(item => {
        if (categoryVal !== 'all' && item.category !== categoryVal) return false;
        if (typeVal !== 'all' && item.type !== typeVal) return false;
        if (searchVal) {
            const contentMatch = (item.content || '').toLowerCase().includes(searchVal);
            const legisMatch = (item.legislation || '').toLowerCase().includes(searchVal);
            const typeMatch = (item.type || '').toLowerCase().includes(searchVal);
            if (!(contentMatch || legisMatch || typeMatch)) return false;
        }
        return true;
    });
    currentPage = 1;
    renderCurrentPage();
    renderPagination();
    statsSpan.innerText = `${filteredData.length} registros encontrados (total: ${currentData.length})`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderCurrentPage() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = filteredData.slice(start, end);

    if (pageItems.length === 0) {
        resultsContainer.innerHTML = `<div class="no-results">🔍 No se encontraron comparecencias con esos filtros.<br>Prueba otros criterios o reinicia los filtros.</div>`;
        return;
    }

    resultsContainer.innerHTML = pageItems.map(item => {
        const safeContent = escapeHtml(item.content || 'Sin contenido descriptivo').replace(/\n/g, '<br>');
        const rawTextContent = item.content || '';
        const typeLabel = item.type || 'Detalle';
        return `
        <div class="card">
            <div class="card-header">
                <div class="badge-group">
                    <span class="category-badge">${escapeHtml(item.category || 'General')}</span>
                    <span class="type-badge">${escapeHtml(typeLabel)}</span>
                </div>
                <button class="copy-btn" data-copy-text="${escapeAttr(rawTextContent)}" data-copy-type="${escapeAttr(typeLabel)}">📋 Copiar texto</button>
            </div>
            <div class="card-content">
                <div class="content-preview">${safeContent}</div>
                ${item.legislation ? `<div class="legislation"><strong>⚖️ Legislación / Doctrina:</strong><br>${escapeHtml(item.legislation).replace(/\n/g, '<br>')}</div>` : '<div class="legislation" style="background:#fafbfe;"><em>Sin referencia normativa específica</em></div>'}
            </div>
            <div class="card-footer">
                <span>🔗 Diligencia policial</span>
            </div>
        </div>`;
    }).join('');

    // Asignar eventos a los botones de copiar
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawText = btn.getAttribute('data-copy-text') || '';
            const typeName = btn.getAttribute('data-copy-type') || 'Comparecencia';
            copyToClipboard(rawText, typeName);
        });
    });
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    paginationDiv.innerHTML = pagesHtml;
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderCurrentPage();
            renderPagination();
            window.scrollTo({ top: 300, behavior: 'smooth' });
        });
    });
}

function resetFilters() {
    categoryFilter.value = 'all';
    updateTypeOptions();
    searchInput.value = '';
    applyFilters();
}

function loadDataFromArray(newDataArray) {
    currentData = [...newDataArray];
    populateFilters();
    applyFilters();
}

// Carga inicial desde textos.json
async function loadInitialData() {
    try {
        const response = await fetch('textos.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
            loadDataFromArray(data);
            showToast("✅ Datos cargados desde textos.json");
        } else {
            throw new Error("El JSON no es un array");
        }
    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `<div class="no-results">❌ Error cargando textos.json: ${error.message}<br>Asegúrate de que el archivo existe en la misma carpeta y estás usando un servidor web (ej: Live Server).</div>`;
        statsSpan.innerText = "Error de carga";
    }
}

// Eventos
categoryFilter.addEventListener('change', () => {
    updateTypeOptions();
    applyFilters();
});
typeFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);
resetBtn.addEventListener('click', resetFilters);

jsonUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            if (Array.isArray(imported) && imported.length && imported[0].hasOwnProperty('category') && imported[0].hasOwnProperty('type') && imported[0].hasOwnProperty('content')) {
                loadDataFromArray(imported);
                showToast(`✅ Datos actualizados: ${imported.length} registros`);
            } else {
                alert('⚠️ Formato inválido: se requiere array de objetos con category, type, content (opcional legislation).');
            }
        } catch (err) {
            alert('Error al parsear JSON: ' + err.message);
        }
        jsonUpload.value = '';
    };
    reader.readAsText(file);
});

downloadBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparecencias_datos.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("📁 JSON exportado");
});

resetDefaultBtn.addEventListener('click', () => {
    loadInitialData();
});

// Iniciar
loadInitialData();