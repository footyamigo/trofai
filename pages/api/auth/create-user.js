// Using AWS SDK directly on the server side
import AWS from 'aws-sdk';
import crypto from 'crypto';

// Configure AWS - supporting variables with and without AWS_ prefix
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Create Cognito client
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    console.log('Creating user account for:', email);
    
    try {
      // Sign up the user with Cognito
      const signUpParams = {
        ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
        Password: password,
        Username: email,
        UserAttributes: [
          {
            Name: 'email',
            Value: email
          },
          {
            Name: 'name',
            Value: fullName || email
          }
        ]
        // Cognito will send the verification email with our customized template
      };
      
      const signUpResult = await cognitoISP.signUp(signUpParams).promise();
      console.log('User created successfully:', signUpResult.UserSub);
      
      return res.status(200).json({
        success: true,
        message: 'User created successfully. Check your email for verification code.',
        userSub: signUpResult.UserSub
      });
      
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle different error types from Cognito
      if (error.code === 'UsernameExistsException') {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      
      if (error.code === 'InvalidPasswordException') {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements. It must be at least 8 characters long and include uppercase, lowercase and numbers.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error.message || 'Error creating user account'
      });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating user account',
      error: error.toString()
    });
  }
} 