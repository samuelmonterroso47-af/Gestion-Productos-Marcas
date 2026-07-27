// Aplica schema.sql sobre la base de datos apuntada por DATABASE_URL.
// Uso: npm run db:init
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function main() {
    const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Esquema aplicado correctamente.');
    await pool.end();
}

main().catch((err) => {
    console.error('Error aplicando el esquema:', err.message);
    process.exit(1);
});
