// Using AWS SDK directly on the server side
import AWS from 'aws-sdk';
import { usersDb } from '../../../src/aws/dynamoDb';
import crypto from 'crypto';

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
    const { username, code, password } = req.body;

    if (!username || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and verification code are required' 
      });
    }
    
    console.log('Attempting to confirm signup for:', username);
    
    // Use AWS SDK to confirm the signup
    const confirmParams = {
      ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      Username: username,
      ConfirmationCode: code
    };
    
    await cognitoISP.confirmSignUp(confirmParams).promise();
    console.log('Account confirmed successfully');

    // Get user attributes from Cognito
    try {
      const userParams = {
        UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
        Username: username
      };
      const userResult = await cognitoISP.adminGetUser(userParams).promise();
      
      // Create user record in DynamoDB without password
      const userData = {
        userId: userResult.Username,
        username: userResult.Username,
        email: userResult.UserAttributes.find(attr => attr.Name === 'email')?.Value,
        name: userResult.UserAttributes.find(attr => attr.Name === 'name')?.Value,
        properties: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await usersDb.createUser(userData.userId, userData);
      console.log('User record created in DynamoDB:', userData.userId);

      // Only attempt auto sign-in if password was provided
      if (password) {
        try {
          // Automatically sign in the user
          const signInParams = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
            AuthParameters: {
              USERNAME: username,
              PASSWORD: password
            }
          };

          const authResult = await cognitoISP.initiateAuth(signInParams).promise();
          console.log('Auto sign-in successful');

          // Generate a session token
          const sessionToken = crypto.randomBytes(64).toString('hex');

          // Create user object for response
          const user = {
            username: userData.username,
            attributes: {
              email: userData.email,
              name: userData.name
            }
          };

          return res.status(200).json({ 
            success: true, 
            message: 'Account confirmed and signed in successfully',
            session: sessionToken,
            user
          });
        } catch (signInError) {
          console.error('Auto sign-in failed:', signInError);
          // If auto sign-in fails, return success but without session
          return res.status(200).json({ 
            success: true, 
            message: 'Account confirmed successfully, please sign in manually'
          });
        }
      } else {
        // No password provided, return success without session
        return res.status(200).json({ 
          success: true, 
          message: 'Account confirmed successfully, please sign in'
        });
      }
    } catch (dbError) {
      console.error('Error creating user record in DynamoDB:', dbError);
      // Don't fail the confirmation if DynamoDB creation fails
      // The user record will be created when they first convert a property
      return res.status(200).json({ 
        success: true, 
        message: 'Account confirmed successfully, please sign in' 
      });
    }
  } catch (error) {
    console.error('Error confirming signup:', error);
    
    // Handle different error types from Cognito
    if (error.code === 'UserNotFoundException') {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this email address' 
      });
    }
    
    if (error.code === 'CodeMismatchException') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
    
    if (error.code === 'ExpiredCodeException') {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error confirming account'
    });
  }
} 