const pool = require('./db-pool');

async function findUserByEmail(email) {
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

async function createUser({ email, username, googleId, picture }) {
  try {
    const query = `
      INSERT INTO users (username, email, google_id, picture_url, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, picture_url as picture, created_at
    `;
    const values = [username, email, googleId, picture];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

module.exports = {
  findUserByEmail,
  createUser
};