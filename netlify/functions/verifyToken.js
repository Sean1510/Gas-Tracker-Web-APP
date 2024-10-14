const jwt = require('jsonwebtoken');

module.exports = (handler) => async (event, context) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'No token provided' }),
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    event.user = decoded;
    return handler(event, context);
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Invalid token' }),
    };
  }
};