// getFuelUps.js
exports.handler = async (event) => {
  const { vehicleId } = event.queryStringParameters;

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM fuel_ups WHERE vehicle_id = $1 ORDER BY date DESC', [vehicleId]);
    client.release();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve fuel-ups' })
    };
  }
};