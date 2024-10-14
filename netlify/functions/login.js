const { Client } = require('pg');
const bcrypt = require('bcrypt');

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

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'All fields are required' }),
    };
  }

  try {
    await client.connect();

    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await client.query(query, [username]);

    if (result.rows.length === 0) {
      await client.end();
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'User not found' }),
      };
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await client.end();
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid credentials' }),
      };
    }

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ id: user.id, username: user.username, email: user.email, created_at: user.created_at }),
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' }),
    };
  }
};
