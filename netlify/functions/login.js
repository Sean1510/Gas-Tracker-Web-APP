const { Client } = require('pg');
const bcrypt = require('bcrypt');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Username and password are required.' }),
    };
  }

  // Query to get the user by username
  const getUserQuery = `
    SELECT id, username, password_hash FROM users WHERE username = $1;
  `;

  try {
    const res = await client.query(getUserQuery, [username]);
    const user = res.rows[0];

    if (!user) {
      await client.end();
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid username or password.' }),
      };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await client.end();
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid username or password.' }),
      };
    }

    // Fetch vehicles associated with the user
    const getVehiclesQuery = `
      SELECT id, vin, make, model, year, initial_mileage FROM vehicles WHERE user_id = $1;
    `;
    const vehiclesRes = await client.query(getVehiclesQuery, [user.id]);

    const vehicles = vehiclesRes.rows;

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
        },
        vehicles,
      }),
    };
  } catch (error) {
    console.error('Error during login:', error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An internal server error occurred.' }),
    };
  }
};
