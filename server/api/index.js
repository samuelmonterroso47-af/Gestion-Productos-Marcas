// Punto de entrada para Vercel: exporta la app de Express como funcion serverless.
// El frontend (public/) se sirve directamente por Vercel via vercel.json, no por aqui.
module.exports = require('../src/app');
