// addVehicle.js
exports.handler = async (event) => {
  const { vin, make, model, year, initialMileage } = JSON.parse(event.body);
  // In a real application, you'd get the user ID from the authenticated session
  const userId = 1; // Placeholder

  try {
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO vehicles(user_id, vin, make, model, year, initial_mileage) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, vin, make, model, year, initialMileage]
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
      body: JSON.stringify({ error: 'Failed to add vehicle' })
    };
  }
};
