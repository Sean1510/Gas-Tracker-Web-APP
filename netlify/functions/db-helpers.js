const { Client } = require('pg');

// Setup PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findUserByEmail(email) {
  try {
    await client.connect();
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await client.query(query, [email]);
    await client.end();
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user:', error);
    await client.end();
    throw error;
  }
}

async function createUser({ email, username, googleId, picture }) {
  try {
    await client.connect();
    const query = `
      INSERT INTO users (username, email, google_id, picture_url, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, picture_url as picture, created_at
    `;
    const values = [username, email, googleId, picture];
    const result = await client.query(query, values);
    await client.end();
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    await client.end();
    throw error;
  }
}

module.exports = {
  findUserByEmail,
  createUser
};