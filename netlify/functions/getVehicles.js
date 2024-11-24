const pool = require('./db-pool');
const verifyToken = require('./verifyToken');

const handler = async (event) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = $1', 
      [event.user.userId]
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error('Error retrieving vehicles:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve vehicles' })
    };
  }
};

exports.handler = verifyToken(handler);