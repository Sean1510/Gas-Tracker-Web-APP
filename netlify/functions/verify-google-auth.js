const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('./db-helpers'); // You'll need to implement these

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

exports.handler = async function(event, context) {
  try {
    // Handle both GET (from Google redirect) and POST (from frontend)
    if (event.httpMethod === 'GET') {
      // Handle Google's redirect
      const code = event.queryStringParameters?.code;
      if (!code) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'No authorization code provided' })
        };
      }
      
      // Process the code
      return await handleGoogleAuth(code);
    } 
    else if (event.httpMethod === 'POST') {
      // Handle direct POST requests
      const { code } = JSON.parse(event.body);
      return await handleGoogleAuth(code);
    }
    else {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method Not Allowed',
          method: event.httpMethod,
          allowedMethods: ['GET', 'POST']
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Authentication failed', details: error.message })
    };
  }
};

// Separate the auth logic into its own function
async function handleGoogleAuth(code) {
  try {
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // For GET requests, redirect to frontend with token
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 302,
        headers: {
          'Location': `/auth-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
        },
      };
    }

    // For POST requests, return JSON
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
    console.error('Error in handleGoogleAuth:', error);
    throw error;
  }
}