const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y ajustala.');
}

const useSsl = /neon\.tech|supabase\.co|render\.com/.test(process.env.DATABASE_URL) || process.env.PGSSL === 'true';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
