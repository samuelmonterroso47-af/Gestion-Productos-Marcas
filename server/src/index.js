// Entrypoint para desarrollo local. En Vercel se usa server/api/index.js en su lugar.
const path = require('path');
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Sirve el frontend estatico (public/) para que la app quede en un solo servicio.
const publicDir = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
