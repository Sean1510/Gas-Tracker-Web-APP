const { Client } = require('pg');
const verifyToken = require('./verifyToken');

const handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const vehicleId = event.queryStringParameters.vehicleId;

  if (!vehicleId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Vehicle ID is required' })
    };
  }

  try {
    await client.connect();
    const result = await client.query('SELECT id, vehicle_id, date, mileage, liters, price_per_liter, total_cost, gas_station, is_full_tank FROM fuel_ups WHERE vehicle_id = $1', [vehicleId]);
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve fuel-ups' })
    };
  } finally {
    await client.end();
  }
};

exports.handler = verifyToken(handler);