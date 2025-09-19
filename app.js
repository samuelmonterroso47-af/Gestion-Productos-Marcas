// ------------------ Funciones Generales ------------------

/**
 * Muestra el módulo y la pestaña correspondientes al ID.
 * @param {string} tabId El ID del botón de la pestaña (ej. 'tab-1').
 */
function switchTab(tabId) {
    // Desactiva todos los botones de las pestañas
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    // Desactiva todos los contenidos de los módulos
    document.querySelectorAll('.module-content').forEach(content => content.classList.remove('active'));
    
    // Activa la pestaña y el módulo correctos
    const targetModuleId = tabId.replace('tab-', 'module-');
    document.getElementById(tabId).classList.add('active');
    document.getElementById(targetModuleId).classList.add('active');
}

/**
 * Exporta el contenido de una tabla a un archivo CSV.
 * @param {string} tableSelector Selector CSS de la tabla.
 * @param {string} filename Nombre del archivo a exportar.
 */
function exportTableToCSV(tableSelector, filename) {
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const csv = Array.from(table.rows)
        .map(row => Array.from(row.cells).map(cell => `"${cell.innerText.trim()}"`).join(','))
        .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ------------------ Funciones de la Base de Datos ------------------

let db = null; // Variable global para la base de datos

/** Carga la base de datos y ejecuta las funciones de renderizado. */
async function loadDatabaseAndRender() {
    try {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        const res = await fetch('./dashboard3wh.db');
        const buffer = await res.arrayBuffer();
        db = new SQL.Database(new Uint8Array(buffer));
        console.log("Base de datos cargada correctamente.");
        // Aquí puedes llamar a las funciones para renderizar los datos
        renderModule1Table();
        // ... otras funciones de renderizado para los demás módulos
    } catch (error) {
        console.error("Error al cargar la base de datos:", error);
    }
}

/** * Ejecuta una consulta SQL y devuelve el resultado.
 * @param {string} query La consulta SQL.
 * @returns {Array} Un array de objetos con los resultados.
 */
function executeSQL(query) {
    if (!db) {
        console.error("Base de datos no está cargada.");
        return [];
    }
    const stmt = db.prepare(query);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// ------------------ Funciones de Renderizado (Ejemplos) ------------------

/** * Renderiza la tabla del Módulo 1 con datos de la BD. 
 * NOTA: Esta es una función de ejemplo, el SQL deberá ser más complejo para ser dinámico.
 */
function renderModule1Table() {
    const tableBody = document.querySelector('#module-1 tbody');
    if (!tableBody) return;

    // Consulta de ejemplo para el Módulo 1 (Mercado 3WH)
    const data = executeSQL("SELECT * FROM market_data_3wh;"); // Asume que existe esta tabla
    
    // Limpia la tabla existente
    tableBody.innerHTML = ''; 
    
    // Agrega los datos a la tabla
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.municipio}</td>
            <td>${row.mototaxis_estimados}</td>
            <td>${row.mes_anterior}</td>
            <td>${row.participacion_mes_anterior}</td>
            <td>${row.mes_actual}</td>
            <td>${row.participacion_mes_actual}</td>
            <td>${row.recomendacion}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// ------------------ Inicialización de Eventos ------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo de Pestañas
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.id));
    });

    // 2. Manejo de Filtros
    // Aplica el filtro del Módulo 1 (3WH)
    const applyFilter1Btn = document.getElementById('applyFilter1');
    if (applyFilter1Btn) {
        applyFilter1Btn.addEventListener('click', () => {
            // Lógica de filtrado para el Módulo 1
            console.log("Filtros del Módulo 1 aplicados.");
            // Aquí iría el código para volver a renderizar la tabla con los filtros aplicados
        });
    }

    // Aplica el filtro del Módulo 4.1 (Clientes Potenciales)
    const applyFilter4_1Btn = document.getElementById('applyFilter4');
    if (applyFilter4_1Btn) {
        applyFilter4_1Btn.addEventListener('click', () => {
            // Lógica de filtrado para el Módulo 4.1
            console.log("Filtros del Módulo 4.1 aplicados.");
            // Aquí iría el código para volver a renderizar la tabla con los filtros aplicados
        });
    }

    // 3. Manejo de Exportación a CSV
    document.querySelectorAll('.btn-success').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const module = e.target.closest('.module-content');
            if (module) {
                const tableId = `#${module.id} table`;
                const filename = `${module.id}.csv`;
                exportTableToCSV(tableId, filename);
            }
        });
    });

    // 4. Carga inicial de la BD y del Dashboard
    loadDatabaseAndRender();
    switchTab('tab-1'); // Muestra el primer módulo al cargar la página
});