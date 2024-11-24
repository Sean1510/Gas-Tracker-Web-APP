const { OAuth2Client } = require('google-auth-library');

// Configure OAuth2 client
const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI, // e.g., "https://your-site.netlify.app/.netlify/functions/verify-google-auth"
});

exports.handler = async function(event, context) {
  try {
    // Generate Google OAuth URL
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: authorizeUrl })
    };
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate authentication URL' })
    };
  }
};