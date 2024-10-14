const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Username and password are required.' }),
    };
  }

  try {
    await client.connect();
    const res = await client.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    const user = res.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid username or password.' }),
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
        }
      }),
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An internal server error occurred.' }),
    };
  } finally {
    await client.end();
  }
};