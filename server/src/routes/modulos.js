const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

function estadoRecuperacion(dias) {
    if (dias === null) return 'Sin compras';
    if (dias <= 30) return 'Normal';
    if (dias <= 90) return 'Alerta';
    return 'Critico';
}

// GET /api/modulos/mercado/:tipo  (tipo = 3WH | 2WH | ...)
// Participacion de mercado por municipio comparando el mes actual contra el anterior.
router.get('/mercado/:tipo', async (req, res) => {
    const { tipo } = req.params;
    const { departamento, municipio, umbral = 10 } = req.query;

    const params = [tipo];
    let where = 'v.tipo_producto = $1';
    if (departamento) { params.push(departamento); where += ` AND v.departamento = $${params.length}`; }
    if (municipio) { params.push(municipio); where += ` AND v.municipio = $${params.length}`; }

    const periodos = await pool.query(
        `SELECT DISTINCT date_trunc('month', fecha) AS mes FROM ventas WHERE tipo_producto = $1
         ORDER BY mes DESC LIMIT 2`,
        [tipo]
    );
    const [mesActual, mesAnterior] = periodos.rows.map((r) => r.mes);

    if (!mesActual) return res.json({ meta: { tipo, mesActual: null, mesAnterior: null }, datos: [] });

    const { rows } = await pool.query(
        `SELECT v.municipio, v.departamento,
                pe.unidades_estimadas,
                SUM(v.cantidad) FILTER (WHERE date_trunc('month', v.fecha) = $${params.length + 1}) AS cantidad_actual,
                SUM(v.monto)    FILTER (WHERE date_trunc('month', v.fecha) = $${params.length + 1}) AS monto_actual,
                SUM(v.cantidad) FILTER (WHERE date_trunc('month', v.fecha) = $${params.length + 2}) AS cantidad_anterior,
                SUM(v.monto)    FILTER (WHERE date_trunc('month', v.fecha) = $${params.length + 2}) AS monto_anterior
         FROM ventas v
         LEFT JOIN parque_estimado pe ON pe.municipio = v.municipio AND pe.tipo_producto = v.tipo_producto
         WHERE ${where}
         GROUP BY v.municipio, v.departamento, pe.unidades_estimadas
         ORDER BY v.municipio`,
        [...params, mesActual, mesAnterior || mesActual]
    );

    const datos = rows.map((r) => {
        const unidades = Number(r.unidades_estimadas) || null;
        const cantidadActual = Number(r.cantidad_actual) || 0;
        const cantidadAnterior = Number(r.cantidad_anterior) || 0;
        const participacionActual = unidades ? (cantidadActual / unidades) * 100 : null;
        const participacionAnterior = unidades ? (cantidadAnterior / unidades) * 100 : null;
        const recomendacion = participacionActual === null
            ? 'Sin dato de parque estimado'
            : participacionActual < Number(umbral)
                ? 'Enfocar en este municipio'
                : 'Mantener / Expandir';

        return {
            municipio: r.municipio,
            departamento: r.departamento,
            unidadesEstimadas: unidades,
            montoAnterior: Number(r.monto_anterior) || 0,
            participacionAnterior,
            montoActual: Number(r.monto_actual) || 0,
            participacionActual,
            recomendacion,
        };
    });

    res.json({ meta: { tipo, mesActual, mesAnterior: mesAnterior || null, umbral: Number(umbral) }, datos });
});

// GET /api/modulos/promedios-clientes
router.get('/promedios-clientes', async (req, res) => {
    const { cliente } = req.query;
    const params = [];
    let where = '1=1';
    if (cliente) { params.push(cliente); where += ` AND cliente = $${params.length}`; }

    const { rows } = await pool.query(
        `SELECT cliente, date_trunc('month', fecha) AS mes, SUM(monto) AS monto
         FROM ventas WHERE ${where}
         GROUP BY cliente, mes
         ORDER BY cliente, mes DESC`,
        params
    );

    const porCliente = new Map();
    rows.forEach((r) => {
        if (!porCliente.has(r.cliente)) porCliente.set(r.cliente, []);
        porCliente.get(r.cliente).push({ mes: r.mes, monto: Number(r.monto) });
    });

    const meses = [...new Set(rows.map((r) => r.mes.getTime()))].sort((a, b) => b - a);
    const mesActualTs = meses[0];

    const datos = [...porCliente.entries()].map(([clienteNombre, historial]) => {
        const mesActual = historial.find((h) => h.mes.getTime() === mesActualTs)?.monto || 0;
        const ultimos3 = historial.slice(0, 3);
        const ultimos6 = historial.slice(0, 6);
        const promedio3 = ultimos3.reduce((s, h) => s + h.monto, 0) / (ultimos3.length || 1);
        const promedio6 = ultimos6.reduce((s, h) => s + h.monto, 0) / (ultimos6.length || 1);

        let clasificacion = 'normal';
        let tendencia = 'Estable';
        if (mesActual === 0 && historial.length > 1) {
            clasificacion = 'sin-compra';
            tendencia = 'Sin compra';
        } else if (historial.length <= 2) {
            clasificacion = 'nuevo';
            tendencia = 'Nuevo';
        } else if (promedio3 > 0 && mesActual < promedio3 * 0.7) {
            clasificacion = 'riesgo';
            tendencia = 'A la baja';
        } else if (promedio3 > 0 && mesActual > promedio3 * 1.2) {
            tendencia = 'En aumento';
        }

        return { cliente: clienteNombre, mesActual, promedio6, promedio3, clasificacion, tendencia };
    });

    // Top clientes = 20% superior por mes actual (entre los que compraron).
    const conCompra = datos.filter((d) => d.mesActual > 0).sort((a, b) => b.mesActual - a.mesActual);
    const corte = Math.max(1, Math.ceil(conCompra.length * 0.2));
    conCompra.slice(0, corte).forEach((d) => {
        if (d.clasificacion === 'normal') d.clasificacion = 'top';
    });

    res.json({
        resumen: {
            sinCompra: datos.filter((d) => d.clasificacion === 'sin-compra').length,
            nuevos: datos.filter((d) => d.clasificacion === 'nuevo').length,
            enRiesgo: datos.filter((d) => d.clasificacion === 'riesgo').length,
            top: datos.filter((d) => d.clasificacion === 'top').length,
        },
        datos,
    });
});

// GET /api/modulos/recuperacion-marcas
router.get('/recuperacion-marcas', async (req, res) => {
    const { cliente, marca } = req.query;
    const params = [];
    let where = '1=1';
    if (cliente) { params.push(cliente); where += ` AND cliente = $${params.length}`; }
    if (marca) { params.push(marca); where += ` AND marca = $${params.length}`; }

    const { rows } = await pool.query(
        `SELECT cliente, marca, MAX(fecha) AS ultima_compra
         FROM ventas WHERE ${where}
         GROUP BY cliente, marca
         ORDER BY cliente, marca`,
        params
    );

    const datos = rows.map((r) => {
        const dias = Math.floor((Date.now() - new Date(r.ultima_compra).getTime()) / 86400000);
        return {
            cliente: r.cliente,
            marca: r.marca,
            ultimaCompra: r.ultima_compra,
            diasTranscurridos: dias,
            estado: estadoRecuperacion(dias),
        };
    });

    res.json({ datos });
});

// GET /api/modulos/recuperacion-codigos
router.get('/recuperacion-codigos', async (req, res) => {
    const { cliente, codigo } = req.query;
    const params = [];
    let where = "codigo IS NOT NULL AND codigo <> ''";
    if (cliente) { params.push(cliente); where += ` AND cliente = $${params.length}`; }
    if (codigo) { params.push(codigo); where += ` AND codigo = $${params.length}`; }

    const { rows } = await pool.query(
        `SELECT cliente, codigo, MAX(fecha) AS ultima_compra
         FROM ventas WHERE ${where}
         GROUP BY cliente, codigo
         ORDER BY cliente, codigo`,
        params
    );

    const relacionados = await pool.query('SELECT codigo_principal, codigo_relacionado FROM codigos_relacionados');
    const mapaRelacionados = new Map();
    relacionados.rows.forEach((r) => {
        if (!mapaRelacionados.has(r.codigo_principal)) mapaRelacionados.set(r.codigo_principal, []);
        mapaRelacionados.get(r.codigo_principal).push(r.codigo_relacionado);
    });

    const datos = rows.map((r) => {
        const dias = Math.floor((Date.now() - new Date(r.ultima_compra).getTime()) / 86400000);
        return {
            cliente: r.cliente,
            codigo: r.codigo,
            codigosRelacionados: mapaRelacionados.get(r.codigo) || [],
            ultimaCompra: r.ultima_compra,
            diasTranscurridos: dias,
            estado: dias <= 90 ? 'Recuperado' : 'Pendiente',
        };
    });

    res.json({ datos });
});

// GET /api/modulos/oportunidades-promocion
router.get('/oportunidades-promocion', async (req, res) => {
    const { cliente, marca } = req.query;
    const params = [];
    let where = '1=1';
    if (cliente) { params.push(cliente); where += ` AND cc.nombre = $${params.length}`; }
    if (marca) { params.push(marca); where += ` AND cm.nombre = $${params.length}`; }

    const { rows } = await pool.query(
        `SELECT cc.nombre AS cliente, cm.nombre AS marca
         FROM catalogo_clientes cc
         CROSS JOIN catalogo_marcas cm
         WHERE ${where}
           AND NOT EXISTS (
             SELECT 1 FROM ventas v WHERE v.cliente = cc.nombre AND v.marca = cm.nombre
           )
         ORDER BY cc.nombre, cm.nombre`,
        params
    );

    const datos = rows.map((r) => ({
        cliente: r.cliente,
        marca: r.marca,
        estado: 'Nunca comprado',
        accionRecomendada: `Ofrecer combo de bienvenida con ${r.marca}`,
    }));

    res.json({ datos });
});

module.exports = router;
