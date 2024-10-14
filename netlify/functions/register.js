const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Setup PostgreSQL client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  const { username, email, password } = JSON.parse(event.body);

  if (!username || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'All fields are required' }),
    };
  }

  try {
    await client.connect();

    // Check if the user already exists
    const userCheckQuery = 'SELECT * FROM users WHERE username = $1 OR email = $2';
    const userCheckResult = await client.query(userCheckQuery, [username, email]);
    if (userCheckResult.rows.length > 0) {
      await client.end();
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Username or Email already exists' }),
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at
    `;
    const values = [username, email, passwordHash];
    const result = await client.query(query, values);
    const newUser = result.rows[0];

    await client.end();

    return {
      statusCode: 201,
      body: JSON.stringify(newUser),
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' }),
    };
  }
};
