const pool = require('./db-pool');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  // Verify the JWT token
  const token = event.headers.authorization.split(' ')[1];
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid token' })
    };
  }

  const { vin, make, model, year, currentMileage } = JSON.parse(event.body);
  const mileage = currentMileage ?? 0;

  try {
    const result = await pool.query(
      'INSERT INTO vehicles(user_id, vin, make, model, year, current_mileage) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, vin, make, model, year, mileage]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error('Error adding vehicle:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An error occurred while adding the vehicle.' })
    };
  }
};