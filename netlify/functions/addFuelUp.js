// addFuelUp.js
exports.handler = async (event) => {
  const { vehicleId, mileage, liters, price, gasStation, totalCost } = JSON.parse(event.body);

  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO fuel_ups(vehicle_id, mileage, liters, price_per_liter, total_cost, gas_station) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [vehicleId, mileage, liters, price, totalCost, gasStation]
    );
    client.release();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to add fuel-up' })
    };
  }
};