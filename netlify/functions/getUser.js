// getUser.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

exports.handler = async (event) => {
  // In a real application, you'd get the user ID from the authenticated session
  const userId = 1; // Placeholder

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    client.release();

    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password_hash; // Don't send password hash to client
      return {
        statusCode: 200,
        body: JSON.stringify(user)
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve user' })
    };
  }
};