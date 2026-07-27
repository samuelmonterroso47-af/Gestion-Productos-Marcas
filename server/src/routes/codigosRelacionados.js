const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        'SELECT id, codigo_principal AS "codigoPrincipal", codigo_relacionado AS "codigoRelacionado" FROM codigos_relacionados ORDER BY codigo_principal'
    );
    res.json(rows);
});

router.post('/', async (req, res) => {
    const codigoPrincipal = String(req.body.codigoPrincipal || '').trim();
    const codigoRelacionado = String(req.body.codigoRelacionado || '').trim();

    if (!codigoPrincipal || !codigoRelacionado) {
        return res.status(400).json({ error: 'codigoPrincipal y codigoRelacionado son obligatorios.' });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO codigos_relacionados (codigo_principal, codigo_relacionado)
             VALUES ($1, $2)
             ON CONFLICT (codigo_principal, codigo_relacionado) DO NOTHING
             RETURNING id, codigo_principal AS "codigoPrincipal", codigo_relacionado AS "codigoRelacionado"`,
            [codigoPrincipal, codigoRelacionado]
        );
        res.status(201).json(rows[0] || { codigoPrincipal, codigoRelacionado, yaExistia: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
