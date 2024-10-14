const { Client } = require('pg');
const verifyToken = require('./verifyToken');

const handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM vehicles WHERE user_id = $1', [event.user.userId]);
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve vehicles' })
    };
  } finally {
    await client.end();
  }
};

exports.handler = verifyToken(handler);