// ------------------ Funciones Generales ------------------

/**
 * Cambia la pestaña activa y muestra el módulo correspondiente.
 * @param {string} tabId El ID del botón de la pestaña (ej. 'tab-1', 'tab-4-1').
 */
function switchTab(tabId) {
    // Desactiva todos los botones y módulos
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.module-content').forEach(content => content.classList.remove('active'));
    
    // Activa la pestaña y el módulo correctos
    const targetModuleId = tabId.replace('tab-', 'module-');
    document.getElementById(tabId).classList.add('active');
    document.getElementById(targetModuleId).classList.add('active');
}

/**
 * Aplica filtros a la tabla de un módulo específico.
 * @param {string} moduleId El ID del módulo (ej. 'module-1').
 */
function applyFilters(moduleId) {
    const tableBody = document.querySelector(`#${moduleId} tbody`);
    if (!tableBody) return;

    // Obtiene los valores de los filtros del módulo
    let filters = {};
    document.querySelectorAll(`#${moduleId} .filter-select`).forEach(select => {
        filters[select.id] = select.value;
    });

    // Filtra las filas de la tabla
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        let isMatch = true;
        
        // Lógica de filtrado genérica
        if (moduleId === 'module-1') {
            const depto = row.dataset.departamento || '';
            const muni = row.cells[0].innerText;
            if (filters['departamento1Filter'] && filters['departamento1Filter'] !== depto) {
                isMatch = false;
            }
            if (filters['municipio1Filter'] && filters['municipio1Filter'] !== muni) {
                isMatch = false;
            }
        }
        
        // Lógica de filtrado para clientes potenciales (Módulo 4.1)
        if (moduleId === 'module-4-1') {
            const marca = row.cells[2].innerText;
            const depto = row.cells[1].innerText;
            if (filters['marcaPotencialFilter'] && !marca.includes(filters['marcaPotencialFilter'])) {
                isMatch = false;
            }
            if (filters['departamentoPotencialFilter'] && !depto.includes(filters['departamentoPotencialFilter'])) {
                isMatch = false;
            }
        }
        
        // Muestra u oculta la fila
        row.style.display = isMatch ? '' : 'none';
    });
}

// ------------------ Inicialización ------------------
document.addEventListener('DOMContentLoaded', () => {

    // 1. Manejo de Pestañas
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.id));
    });

    // 2. Manejo de Filtros
    // Asocia los botones de filtro con la función `applyFilters`
    const filterButtons = {
        'applyFilter1': 'module-1',
        'applyFilter2': 'module-2',
        'applyFilter3': 'module-3',
        'applyFilter4': 'module-4',
        'applyFilter4-1': 'module-4-1',
        'applyFilter5': 'module-5'
    };
    
    for (const buttonId in filterButtons) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener('click', () => applyFilters(filterButtons[buttonId]));
        }
    }

    // 3. Activa la primera pestaña al cargar la página
    switchTab('tab-1');
});