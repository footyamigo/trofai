import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Create Cognito Identity Service Provider client
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { session } = req.body;

    if (!session) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session token is required' 
      });
    }

    // In a production environment, you would invalidate the session token here
    // For now, we'll just return success since the client will remove the token

    return res.status(200).json({
      success: true,
      message: 'Successfully signed out'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error signing out'
    });
  }
} 