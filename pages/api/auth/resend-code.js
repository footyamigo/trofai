// Using AWS SDK directly on the server side
import AWS from 'aws-sdk';

// Configure AWS - supporting variables with and without AWS_ prefix
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Create a Cognito Identity Service Provider client
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('Attempting to resend confirmation code for:', email);
    console.log('Using user pool:', process.env.NEXT_PUBLIC_USER_POOL_ID);
    
    // Use AWS SDK to resend the confirmation code
    const params = {
      ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      Username: email
    };
    
    await cognitoISP.resendConfirmationCode(params).promise();
    console.log('Verification code resent successfully');

    return res.status(200).json({ 
      success: true, 
      message: 'Verification code has been resent to your email' 
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    
    // Handle different error types from Cognito
    if (error.code === 'UserNotFoundException') {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this email address' 
      });
    }
    
    if (error.code === 'LimitExceededException') {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many attempts. Please try again later' 
      });
    }
    
    if (error.code === 'InvalidParameterException') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error resending verification code'
    });
  }
} 