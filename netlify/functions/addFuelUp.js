const pool = require('./db-pool');
const verifyToken = require('./verifyToken');

const handler = async (event) => {
  const { vehicle_id, date, mileage, liters, price_per_liter, gas_station, is_full_tank } = JSON.parse(event.body);

  if (!vehicle_id || !date || !mileage || !liters || !price_per_liter || !gas_station) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'All fields are required' })
    };
  }

  try {
    const result = await pool.query(
      'INSERT INTO fuel_ups (vehicle_id, date, mileage, liters, price_per_liter, total_cost, gas_station, is_full_tank) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [vehicle_id, date, mileage, liters, price_per_liter, liters * price_per_liter, gas_station, is_full_tank]
    );
    return {
      statusCode: 201,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add fuel-up' })
    };
  }
};

exports.handler = verifyToken(handler);