// ------------------ Funciones Generales ------------------

// Cambiar entre pestañas
function switchTab(tabId) {
    document.querySelectorAll('.module-content').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
    
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');

    const moduleNumber = tabId.split('-')[1];
    const module = document.getElementById(`module-${moduleNumber}`);
    if (module) module.classList.add('active');
}

// Mostrar detalles en modal
function showDetails(code) {
    const details = {
        'A101': ['A102 - Compras: 2 (2023-09-10, 2023-10-05)', 'A103 - Compras: 1 (2023-08-15)'],
        'B202': ['B203 - Compras: 1 (2023-08-22)'],
        'C303': ['C304 - Compras: 2 (2023-10-12, 2023-11-01)', 'C305 - Compras: 1 (2023-09-18)', 'C306 - Compras: 2 (2023-10-20, 2023-11-02)']
    };

    const alternates = details[code] || ['No tiene códigos alternos'];
    const html = `
        <p><strong>Código Madre:</strong> ${code}</p>
        <p><strong>Fecha Última Compra:</strong> 2023-10-15</p>
        <p><strong>Continuidad:</strong> Buena continuidad</p>
        <p class="mt-4"><strong>Códigos Alternos:</strong></p>
        <ul class="list-disc pl-5 mt-2">
            ${alternates.map(a => `<li>${a}</li>`).join('')}
        </ul>
    `;
    const modal = document.getElementById('detail-modal');
    document.getElementById('modal-details').innerHTML = html;
    if (modal) modal.style.display = 'flex';
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) modal.style.display = 'none';
}

// Asociar código alterno
function associateAlternateCode() {
    const mother = document.getElementById('motherCode').value.trim();
    const alt = document.getElementById('alternateCode').value.trim();
    if (!mother || !alt) return alert('Complete ambos campos');
    alert(`Código alterno "${alt}" asociado a "${mother}"`);
    document.getElementById('motherCode').value = '';
    document.getElementById('alternateCode').value = '';
}

// Buscar códigos
function searchCodes() {
    const term = document.getElementById('codeSearch').value.toLowerCase();
    console.log(`Buscando: ${term}`);
    // Aquí iría la lógica real de búsqueda
}

// Exportar tabla a CSV
function exportTableToCSV(tableSelector, filename) {
    const table = document.querySelector(tableSelector);
    if (!table) return;
    const csv = Array.from(table.rows)
        .map(r => Array.from(r.cells).map(c => `"${c.innerText}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ------------------ Funciones de filtros ------------------

// Filtro genérico por módulo
function aplicarFiltros(modulo) {
    const deptoFilter = document.getElementById(`departamento${modulo}Filter`)?.value.toLowerCase() || "";
    const muniFilter = document.getElementById(`municipio${modulo}Filter`)?.value.toLowerCase() || "";

    document.querySelectorAll(`#module-${modulo} tbody tr`).forEach(row => {
        const depto = (row.dataset.departamento || "").toLowerCase();
        const muni = row.cells[0].innerText.toLowerCase();
        row.style.display = ((deptoFilter === "" || depto === deptoFilter) &&
                             (muniFilter === "" || muni.includes(muniFilter))) ? "" : "none";
    });
}

// Filtro específico por clasificación de clientes (módulo 3)
function aplicarFiltroClientes() {
    const filtro = document.getElementById('clientePromedioFilter')?.value || "";
    document.querySelectorAll('#module-3 tbody tr').forEach(row => {
        row.style.display = (filtro === "" || row.dataset.clasificacion === filtro) ? "" : "none";
    });
}

// ------------------ Base de Datos ------------------

async function cargarBD() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    const url = './dashboard3wh.db';
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));

    const resultado = db.exec("SELECT * FROM ventas LIMIT 5");
    console.log("Resultado:", resultado);
    document.getElementById("resultado").innerText = JSON.stringify(resultado, null, 2);
}

// ------------------ Inicialización ------------------
document.addEventListener('DOMContentLoaded', () => {
    // Pestañas
    document.querySelectorAll('.tab-button').forEach(tab => tab.addEventListener('click', () => switchTab(tab.id)));

    // Botones de filtros
    ['applyFilter1','applyFilter2','applyFilter3','applyFilter4','applyFilter5'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => {
            if (id === 'applyFilter3') aplicarFiltroClientes();
            else aplicarFiltros(parseInt(id.replace(/\D/g,'')));
        });
    });

    // Buscar y asociar códigos
    document.getElementById('searchButton')?.addEventListener('click', searchCodes);
    document.getElementById('associateButton')?.addEventListener('click', associateAlternateCode);
    document.getElementById('codeSearch')?.addEventListener('keypress', e => { if(e.key==='Enter') searchCodes(); });

    // Exportar CSV
    document.querySelectorAll('.btn-success').forEach((btn, i) =>
        btn.addEventListener('click', () => exportTableToCSV(`#module-${i+1} table`, `modulo${i+1}.csv`))
    );

    // Filtro ejemplo 3WH
    document.getElementById('municipio3WHFilter')?.addEventListener('change', function() {
        const val = this.value.toLowerCase();
        document.querySelectorAll('#module-1 tbody tr').forEach(row => {
            row.style.display = (val === "" || row.cells[0].innerText.toLowerCase().includes(val)) ? "" : "none";
        });
    });

    // Usuario simulado
    const user = document.getElementById('userIdDisplay');
    if(user) user.textContent = "UsuarioDemo123";

    // Activar primera pestaña
    const firstTab = document.querySelector('.tab-button');
    if(firstTab) switchTab(firstTab.id);

    // Cargar BD
    cargarBD();
});
