const express = require('express');
const multer = require('multer');
const pool = require('../db/pool');
const { parseWorkbookBuffer } = require('../utils/excel');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /\.(xlsx|xlsm|csv)$/i.test(file.originalname);
        cb(ok ? null : new Error('Formato no soportado. Sube un archivo .xlsx o .csv'), ok);
    },
});

function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        // numero serial de Excel (dias desde 1899-12-30)
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toNumber(value) {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
}

// POST /api/upload/ventas
// Columnas esperadas: fecha, cliente, departamento, municipio, marca, codigo, tipo_producto, cantidad, monto
router.post('/ventas', upload.single('archivo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibio ningun archivo (campo "archivo").' });

    let rows;
    try {
        rows = await parseWorkbookBuffer(req.file.buffer, req.file.originalname);
    } catch (err) {
        return res.status(400).json({ error: `No se pudo leer el archivo: ${err.message}` });
    }

    const errores = [];
    const validas = [];

    rows.forEach((row, idx) => {
        const numeroFila = idx + 2; // +1 por encabezado, +1 por indice base 0
        const fecha = toDate(row.fecha);
        const cliente = String(row.cliente || '').trim();
        const departamento = String(row.departamento || '').trim();
        const municipio = String(row.municipio || '').trim();
        const marca = String(row.marca || '').trim();
        const codigo = String(row.codigo || '').trim() || null;
        const tipoProducto = String(row.tipo_producto || '').trim();
        const cantidad = toNumber(row.cantidad);
        const monto = toNumber(row.monto);

        if (!fecha || !cliente || !departamento || !municipio || !marca || !tipoProducto) {
            errores.push({ fila: numeroFila, motivo: 'Faltan campos obligatorios (fecha, cliente, departamento, municipio, marca, tipo_producto).' });
            return;
        }
        validas.push({ fecha, cliente, departamento, municipio, marca, codigo, tipoProducto, cantidad, monto });
    });

    if (validas.length === 0) {
        return res.status(400).json({ error: 'No hay filas validas para insertar.', errores });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const v of validas) {
            await client.query(
                `INSERT INTO ventas (fecha, cliente, departamento, municipio, marca, codigo, tipo_producto, cantidad, monto)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [v.fecha, v.cliente, v.departamento, v.municipio, v.marca, v.codigo, v.tipoProducto, v.cantidad, v.monto]
            );
        }
        await client.query(
            `INSERT INTO catalogo_clientes (nombre, departamento, municipio)
             SELECT DISTINCT ON (cliente) cliente, departamento, municipio FROM UNNEST($1::text[], $2::text[], $3::text[]) AS t(cliente, departamento, municipio)
             ON CONFLICT (nombre) DO NOTHING`,
            [validas.map((v) => v.cliente), validas.map((v) => v.departamento), validas.map((v) => v.municipio)]
        );
        await client.query(
            `INSERT INTO catalogo_marcas (nombre) SELECT DISTINCT UNNEST($1::text[]) ON CONFLICT (nombre) DO NOTHING`,
            [validas.map((v) => v.marca)]
        );
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: `Error guardando en la base de datos: ${err.message}` });
    } finally {
        client.release();
    }

    res.json({ insertadas: validas.length, descartadas: errores.length, errores });
});

// POST /api/upload/parque-estimado
// Columnas esperadas: departamento, municipio, tipo_producto, unidades_estimadas
router.post('/parque-estimado', upload.single('archivo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibio ningun archivo (campo "archivo").' });

    let rows;
    try {
        rows = await parseWorkbookBuffer(req.file.buffer, req.file.originalname);
    } catch (err) {
        return res.status(400).json({ error: `No se pudo leer el archivo: ${err.message}` });
    }

    const errores = [];
    const validas = [];
    rows.forEach((row, idx) => {
        const numeroFila = idx + 2;
        const departamento = String(row.departamento || '').trim();
        const municipio = String(row.municipio || '').trim();
        const tipoProducto = String(row.tipo_producto || '').trim();
        const unidadesEstimadas = toNumber(row.unidades_estimadas);

        if (!departamento || !municipio || !tipoProducto) {
            errores.push({ fila: numeroFila, motivo: 'Faltan campos obligatorios (departamento, municipio, tipo_producto).' });
            return;
        }
        validas.push({ departamento, municipio, tipoProducto, unidadesEstimadas });
    });

    if (validas.length === 0) {
        return res.status(400).json({ error: 'No hay filas validas para insertar.', errores });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const v of validas) {
            await client.query(
                `INSERT INTO parque_estimado (departamento, municipio, tipo_producto, unidades_estimadas)
                 VALUES ($1,$2,$3,$4)
                 ON CONFLICT (municipio, tipo_producto) DO UPDATE SET
                   departamento = EXCLUDED.departamento,
                   unidades_estimadas = EXCLUDED.unidades_estimadas`,
                [v.departamento, v.municipio, v.tipoProducto, v.unidadesEstimadas]
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: `Error guardando en la base de datos: ${err.message}` });
    } finally {
        client.release();
    }

    res.json({ insertadas: validas.length, descartadas: errores.length, errores });
});

module.exports = router;
