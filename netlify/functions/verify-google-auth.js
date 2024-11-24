const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('./db-helpers'); // You'll need to implement these

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

exports.handler = async function(event, context) {
  // Add debugging logs
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method Not Allowed',
          method: event.httpMethod,
          allowedMethod: 'POST'
        })
      };
    }

    const { code } = JSON.parse(event.body);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoClient = new OAuth2Client();
    const ticket = await userInfoClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const googleUserData = ticket.getPayload();

    // Check if user exists in your database
    let user = await findUserByEmail(googleUserData.email);

    // If user doesn't exist, create new user
    if (!user) {
      user = await createUser({
        email: googleUserData.email,
        username: googleUserData.name,
        googleId: googleUserData.sub,
        picture: googleUserData.picture
      });
    }

    // Generate JWT token for your app
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          picture: user.picture
        },
        token
      })
    };

  } catch (error) {
    console.error('Error verifying Google auth:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Authentication failed' })
    };
  }
};