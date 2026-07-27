const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/departamentos', async (req, res) => {
    const { rows } = await pool.query('SELECT DISTINCT departamento FROM ventas ORDER BY departamento');
    res.json(rows.map((r) => r.departamento));
});

router.get('/municipios', async (req, res) => {
    const { departamento } = req.query;
    const params = [];
    let where = '1=1';
    if (departamento) { params.push(departamento); where += ` AND departamento = $${params.length}`; }
    const { rows } = await pool.query(`SELECT DISTINCT municipio FROM ventas WHERE ${where} ORDER BY municipio`, params);
    res.json(rows.map((r) => r.municipio));
});

router.get('/marcas', async (req, res) => {
    const { rows } = await pool.query('SELECT nombre FROM catalogo_marcas ORDER BY nombre');
    res.json(rows.map((r) => r.nombre));
});

router.get('/clientes', async (req, res) => {
    const { rows } = await pool.query('SELECT nombre FROM catalogo_clientes ORDER BY nombre');
    res.json(rows.map((r) => r.nombre));
});

router.get('/codigos', async (req, res) => {
    const { rows } = await pool.query(
        "SELECT DISTINCT codigo FROM ventas WHERE codigo IS NOT NULL AND codigo <> '' ORDER BY codigo"
    );
    res.json(rows.map((r) => r.codigo));
});

module.exports = router;
