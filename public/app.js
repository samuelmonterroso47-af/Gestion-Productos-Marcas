// ------------------ Utilidades ------------------

const API = '/api';

async function apiGet(path, params = {}) {
    const url = new URL(API + path, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null) url.searchParams.set(k, v);
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error ${res.status}`);
    return res.json();
}

async function apiPostForm(path, formData) {
    const res = await fetch(API + path, { method: 'POST', body: formData });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
    return body;
}

async function apiPostJson(path, data) {
    const res = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
    return body;
}

function fmtMoneda(valor) {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 0 }).format(valor);
}

function fmtPct(valor) {
    if (valor === null || valor === undefined) return '-';
    return `${valor.toFixed(2)}%`;
}

function fmtFecha(valor) {
    if (!valor) return '-';
    return new Date(valor).toISOString().slice(0, 10);
}

function setStatus(id, mensaje, esError = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = mensaje;
    el.style.color = esError ? '#e63946' : '#2ecc71';
}

function llenarSelect(select, valores, seleccionActual = '') {
    if (!select) return;
    const actual = seleccionActual || select.value;
    select.innerHTML = `<option value="">Todos</option>` +
        valores.map((v) => `<option value="${v}">${v}</option>`).join('');
    if (actual && valores.includes(actual)) select.value = actual;
}

// ------------------ Pestañas ------------------

function switchTab(tabId) {
    document.querySelectorAll('.tab-button').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.module-content').forEach((content) => content.classList.remove('active'));

    const btn = document.getElementById(tabId);
    const targetModuleId = btn.dataset.modulo;
    btn.classList.add('active');
    document.getElementById(targetModuleId).classList.add('active');
}

// ------------------ Módulo 1 y 2: Mercado (3WH / 2WH) ------------------

async function cargarMercado(tipo, moduloId, umbral) {
    setStatus(`${moduloId}-status`, 'Cargando...');
    try {
        const { meta, datos } = await apiGet(`/modulos/mercado/${tipo}`, {
            departamento: document.getElementById(`departamento${tipo}Filter`)?.value,
            municipio: document.getElementById(`municipio${tipo}Filter`)?.value,
            umbral,
        });

        const tbody = document.getElementById(`${moduloId}-body`);
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7">No hay datos de ventas tipo "${tipo}" todavía. Sube un Excel en la pestaña "Cargar Datos".</td></tr>`;
        } else {
            tbody.innerHTML = datos.map((d) => `
                <tr data-departamento="${d.departamento}">
                    <td>${d.municipio}</td>
                    <td>${d.unidadesEstimadas ?? '-'}</td>
                    <td>${fmtMoneda(d.montoAnterior)}</td>
                    <td>${fmtPct(d.participacionAnterior)}</td>
                    <td>${fmtMoneda(d.montoActual)}</td>
                    <td class="${d.participacionActual !== null && d.participacionActual < meta.umbral ? 'highlight' : ''}">${fmtPct(d.participacionActual)}</td>
                    <td class="${d.participacionActual !== null && d.participacionActual < meta.umbral ? 'highlight' : ''}">${d.recomendacion}</td>
                </tr>`).join('');
        }
        const rango = meta.mesActual ? `Mes actual: ${fmtFecha(meta.mesActual)} · Mes anterior: ${meta.mesAnterior ? fmtFecha(meta.mesAnterior) : 'N/A'}` : '';
        setStatus(`${moduloId}-status`, rango);
    } catch (err) {
        setStatus(`${moduloId}-status`, err.message, true);
    }
}

// ------------------ Módulo 3: Promedios de Clientes ------------------

async function cargarPromediosClientes() {
    setStatus('module-3-status', 'Cargando...');
    try {
        const { resumen, datos } = await apiGet('/modulos/promedios-clientes');
        document.getElementById('statSinCompra').textContent = resumen.sinCompra;
        document.getElementById('statNuevos').textContent = resumen.nuevos;
        document.getElementById('statRiesgo').textContent = resumen.enRiesgo;
        document.getElementById('statTop').textContent = resumen.top;

        const filtro = document.getElementById('clientePromedioFilter').value;
        const filtrados = filtro ? datos.filter((d) => d.clasificacion === filtro) : datos;

        const claseTendencia = { 'A la baja': 'highlight', 'En aumento': 'positive', 'Sin compra': 'highlight', Nuevo: 'positive', Estable: '' };

        const tbody = document.getElementById('module-3-body');
        tbody.innerHTML = filtrados.length === 0
            ? '<tr><td colspan="5">No hay datos de clientes todavía.</td></tr>'
            : filtrados.map((d) => `
                <tr data-clasificacion="${d.clasificacion}">
                    <td>${d.cliente}</td>
                    <td>${fmtMoneda(d.mesActual)}</td>
                    <td>${fmtMoneda(d.promedio6)}</td>
                    <td>${fmtMoneda(d.promedio3)}</td>
                    <td class="${claseTendencia[d.tendencia] || ''}">${d.tendencia}</td>
                </tr>`).join('');
        setStatus('module-3-status', '');
    } catch (err) {
        setStatus('module-3-status', err.message, true);
    }
}

// ------------------ Módulo 4: Recuperación de Marcas ------------------

async function cargarRecuperacionMarcas() {
    setStatus('module-4-status', 'Cargando...');
    try {
        const { datos } = await apiGet('/modulos/recuperacion-marcas', {
            cliente: document.getElementById('clienteMarcaFilter').value,
            marca: document.getElementById('marcaFilter').value,
        });
        const claseEstado = { Normal: 'positive', Alerta: 'warning', Critico: 'highlight' };
        const tbody = document.getElementById('module-4-body');
        tbody.innerHTML = datos.length === 0
            ? '<tr><td colspan="5">No hay datos todavía.</td></tr>'
            : datos.map((d) => `
                <tr>
                    <td>${d.cliente}</td>
                    <td>${d.marca}</td>
                    <td>${fmtFecha(d.ultimaCompra)}</td>
                    <td>${d.diasTranscurridos}</td>
                    <td class="${claseEstado[d.estado] || ''}">${d.estado}</td>
                </tr>`).join('');
        setStatus('module-4-status', '');
    } catch (err) {
        setStatus('module-4-status', err.message, true);
    }
}

// ------------------ Módulo 5: Recuperación de Códigos ------------------

async function cargarRecuperacionCodigos() {
    setStatus('module-5-status', 'Cargando...');
    try {
        const { datos } = await apiGet('/modulos/recuperacion-codigos', {
            cliente: document.getElementById('clienteCodigoFilter').value,
            codigo: document.getElementById('codigoFilter').value,
        });
        const tbody = document.getElementById('module-5-body');
        tbody.innerHTML = datos.length === 0
            ? '<tr><td colspan="6">No hay datos todavía.</td></tr>'
            : datos.map((d) => `
                <tr>
                    <td>${d.cliente}</td>
                    <td>${d.codigo}</td>
                    <td>${d.codigosRelacionados.join(', ') || '-'}</td>
                    <td>${fmtFecha(d.ultimaCompra)}</td>
                    <td>${d.diasTranscurridos}</td>
                    <td class="${d.estado === 'Recuperado' ? 'positive' : 'highlight'}">${d.estado}</td>
                </tr>`).join('');
        setStatus('module-5-status', '');
    } catch (err) {
        setStatus('module-5-status', err.message, true);
    }
}

// ------------------ Módulo 6: Oportunidades de Promoción ------------------

async function cargarOportunidadesPromocion() {
    setStatus('module-6-status', 'Cargando...');
    try {
        const { datos } = await apiGet('/modulos/oportunidades-promocion', {
            cliente: document.getElementById('clientePromoFilter').value,
            marca: document.getElementById('marcaPromoFilter').value,
        });
        const tbody = document.getElementById('module-6-body');
        tbody.innerHTML = datos.length === 0
            ? '<tr><td colspan="4">No hay oportunidades pendientes con los datos actuales.</td></tr>'
            : datos.map((d) => `
                <tr>
                    <td>${d.cliente}</td>
                    <td>${d.marca}</td>
                    <td class="highlight">${d.estado}</td>
                    <td>${d.accionRecomendada}</td>
                </tr>`).join('');
        setStatus('module-6-status', '');
    } catch (err) {
        setStatus('module-6-status', err.message, true);
    }
}

// ------------------ Filtros: catálogos para los <select> ------------------

async function llenarCatalogos() {
    const [departamentos, municipios, marcas, clientes, codigos] = await Promise.all([
        apiGet('/catalogos/departamentos'),
        apiGet('/catalogos/municipios'),
        apiGet('/catalogos/marcas'),
        apiGet('/catalogos/clientes'),
        apiGet('/catalogos/codigos'),
    ]);

    ['departamento3WHFilter', 'departamento2WHFilter'].forEach((id) => llenarSelect(document.getElementById(id), departamentos));
    ['municipio3WHFilter', 'municipio2WHFilter'].forEach((id) => llenarSelect(document.getElementById(id), municipios));
    ['marcaFilter', 'marcaPromoFilter'].forEach((id) => llenarSelect(document.getElementById(id), marcas));
    ['clienteMarcaFilter', 'clienteCodigoFilter', 'clientePromoFilter'].forEach((id) => llenarSelect(document.getElementById(id), clientes));
    llenarSelect(document.getElementById('codigoFilter'), codigos);
}

// ------------------ Exportar a CSV (tabla visible) ------------------

function exportarModuloACSV(moduloId) {
    const tabla = document.querySelector(`#${moduloId} table`);
    if (!tabla) return;
    const filas = [...tabla.querySelectorAll('tr')].filter((tr) => tr.style.display !== 'none');
    const csv = filas.map((tr) =>
        [...tr.children].map((celda) => `"${celda.innerText.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduloId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ------------------ Carga de archivos ------------------

async function manejarSubidaVentas(evento) {
    evento.preventDefault();
    const archivo = document.getElementById('archivoVentas').files[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append('archivo', archivo);
    setStatus('upload-ventas-status', 'Subiendo...');
    try {
        const resultado = await apiPostForm('/upload/ventas', formData);
        setStatus('upload-ventas-status', `Insertadas: ${resultado.insertadas}. Descartadas: ${resultado.descartadas}.`);
        await llenarCatalogos();
    } catch (err) {
        setStatus('upload-ventas-status', err.message, true);
    }
}

async function manejarSubidaParque(evento) {
    evento.preventDefault();
    const archivo = document.getElementById('archivoParque').files[0];
    if (!archivo) return;
    const formData = new FormData();
    formData.append('archivo', archivo);
    setStatus('upload-parque-status', 'Subiendo...');
    try {
        const resultado = await apiPostForm('/upload/parque-estimado', formData);
        setStatus('upload-parque-status', `Insertadas/actualizadas: ${resultado.insertadas}. Descartadas: ${resultado.descartadas}.`);
    } catch (err) {
        setStatus('upload-parque-status', err.message, true);
    }
}

async function manejarAsociarCodigos() {
    const codigoPrincipal = document.getElementById('codigoPrincipalInput').value.trim();
    const codigoRelacionado = document.getElementById('codigoRelacionadoInput').value.trim();
    if (!codigoPrincipal || !codigoRelacionado) {
        setStatus('asociar-codigos-status', 'Completa ambos códigos.', true);
        return;
    }
    try {
        await apiPostJson('/codigos-relacionados', { codigoPrincipal, codigoRelacionado });
        setStatus('asociar-codigos-status', 'Códigos asociados correctamente.');
        document.getElementById('codigoPrincipalInput').value = '';
        document.getElementById('codigoRelacionadoInput').value = '';
        await cargarRecuperacionCodigos();
    } catch (err) {
        setStatus('asociar-codigos-status', err.message, true);
    }
}

// ------------------ Inicialización ------------------

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.id));
    });

    document.getElementById('applyFilter1').addEventListener('click', () => cargarMercado('3WH', 'module-1', document.getElementById('umbral3wh').value));
    document.getElementById('applyFilter2').addEventListener('click', () => cargarMercado('2WH', 'module-2', 10));
    document.getElementById('applyFilter3').addEventListener('click', cargarPromediosClientes);
    document.getElementById('applyFilter4').addEventListener('click', cargarRecuperacionMarcas);
    document.getElementById('applyFilter5').addEventListener('click', cargarRecuperacionCodigos);
    document.getElementById('applyFilter6').addEventListener('click', cargarOportunidadesPromocion);

    document.querySelectorAll('.btn-export').forEach((btn) => {
        btn.addEventListener('click', () => exportarModuloACSV(btn.dataset.modulo));
    });

    document.getElementById('formVentas').addEventListener('submit', manejarSubidaVentas);
    document.getElementById('formParque').addEventListener('submit', manejarSubidaParque);
    document.getElementById('asociarCodigosBtn').addEventListener('click', manejarAsociarCodigos);

    switchTab('tab-1');

    llenarCatalogos().catch((err) => console.error('Error cargando catálogos:', err));
    cargarMercado('3WH', 'module-1', document.getElementById('umbral3wh').value);
    cargarMercado('2WH', 'module-2', 10);
    cargarPromediosClientes();
    cargarRecuperacionMarcas();
    cargarRecuperacionCodigos();
    cargarOportunidadesPromocion();
});
