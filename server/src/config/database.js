const { Pool } = require('pg');

const pool = new Pool({
    user: 'kibru',
    password: '1234',
    host: 'localhost',
    port: 5432,
    database: 'cumpas_crave'
});

pool.on('connect', () => {
    console.log('✅ Connected to LOCAL PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

module.exports = pool;
