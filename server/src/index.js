require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/upload');
const modulosRoutes = require('./routes/modulos');
const catalogosRoutes = require('./routes/catalogos');
const codigosRelacionadosRoutes = require('./routes/codigosRelacionados');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/codigos-relacionados', codigosRelacionadosRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Sirve el frontend estatico (public/) para que la app quede en un solo servicio.
const publicDir = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Manejador de errores (incluye errores de multer/validacion de archivos).
app.use((err, req, res, next) => {
    console.error(err);
    res.status(400).json({ error: err.message || 'Error inesperado.' });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
