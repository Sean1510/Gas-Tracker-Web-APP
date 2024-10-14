// getVehicles.js
exports.handler = async (event) => {
  // In a real application, you'd get the user ID from the authenticated session
  const userId = 1; // Placeholder

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM vehicles WHERE user_id = $1', [userId]);
    client.release();

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
  }
};