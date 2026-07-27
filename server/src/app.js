require('dotenv').config();
const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/upload');
const modulosRoutes = require('./routes/modulos');
const catalogosRoutes = require('./routes/catalogos');
const codigosRelacionadosRoutes = require('./routes/codigosRelacionados');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/codigos-relacionados', codigosRelacionadosRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Manejador de errores (incluye errores de multer/validacion de archivos).
app.use((err, req, res, next) => {
    console.error(err);
    res.status(400).json({ error: err.message || 'Error inesperado.' });
});

module.exports = app;
