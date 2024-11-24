const pool = require('./db-pool');
const crypto = require('crypto');

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
    // Generate a random password hash for Google users
    // This ensures the not-null constraint is satisfied while preventing regular login
    const randomPassword = crypto.randomBytes(32).toString('hex');
    
    const query = `
      INSERT INTO users (
        username, 
        email, 
        google_id, 
        picture_url, 
        password_hash,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, username, email, picture_url as picture, created_at
    `;
    
    const values = [
      username, 
      email, 
      googleId, 
      picture,
      `GOOGLE_AUTH_${randomPassword}` // Prefix to identify Google-authenticated users
    ];
    
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