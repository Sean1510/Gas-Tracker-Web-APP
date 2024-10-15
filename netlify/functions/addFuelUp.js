const { Client } = require('pg');
const verifyToken = require('./verifyToken');

const handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  const { vehicle_id, mileage, liters, price_per_liter, gas_station, total_cost, date } = JSON.parse(event.body);

  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO fuel_ups(vehicle_id, mileage, liters, price_per_liter, total_cost, gas_station, date) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [vehicle_id, mileage, liters, price_per_liter, total_cost, gas_station, date]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add fuel-up' })
    };
  } finally {
    await client.end();
  }
};

exports.handler = verifyToken(handler);