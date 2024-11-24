const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // Adjust based on your needs
  idleTimeoutMillis: 120000
});

// Clean up pool on exit
process.on('beforeExit', async () => {
  await pool.end();
});

module.exports = pool; 