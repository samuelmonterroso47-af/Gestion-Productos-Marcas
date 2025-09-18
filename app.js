// ------------------ Funciones ------------------

// Cambiar entre pestañas
function switchTab(tabId) {
    document.querySelectorAll('.module-content').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const moduleNumber = tabId.split('-')[1];
    document.getElementById(`module-${moduleNumber}`)?.classList.add('active');
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
        </ul>`;
    document.getElementById('modal-details').innerHTML = html;
    document.getElementById('detail-modal').style.display = 'flex';
}

// Cerrar modal
function closeModal() {
    document.getElementById('detail-modal').style.display = 'none';
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
    // Lógica de búsqueda real aquí
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

// ------------------ Inicialización ------------------
document.addEventListener('DOMContentLoaded', () => {
    // Pestañas
    document.querySelectorAll('.tab-button').forEach(tab => tab.addEventListener('click', () => switchTab(tab.id)));

    // Botones de filtros
    ['applyFilter1','applyFilter2','applyFilter3','applyFilter4','applyFilter5'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => console.log(`Filtros aplicados: ${btn.dataset.label || id}`));
    });

    // Buscar y asociar códigos
    document.getElementById('searchButton')?.addEventListener('click', searchCodes);
    document.getElementById('associateButton')?.addEventListener('click', associateAlternateCode);
    document.getElementById('codeSearch')?.addEventListener('keypress', e => { if(e.key==='Enter') searchCodes(); });

    // Exportar CSV
    document.querySelectorAll('.btn-success').forEach((btn, i) =>
        btn.addEventListener('click', () => exportTableToCSV(`#module-${i+1} table`, `modulo${i+1}.csv`))
    );

    // Filtro ejemplo
    const filter = document.getElementById('municipio3WHFilter');
    if(filter) filter.addEventListener('change', function() {
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
});
