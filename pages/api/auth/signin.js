import AWS from 'aws-sdk';
import crypto from 'crypto';

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

// Create DynamoDB client
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define table names
const TABLES = {
  USERS: 'trofai-users'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Attempt to sign in using Cognito
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };

    try {
      const authResult = await cognitoISP.initiateAuth(params).promise();
      console.log('Sign in successful');

      // Generate a session token
      const sessionToken = crypto.randomBytes(64).toString('hex');

      // Get user attributes
      const userParams = {
        AccessToken: authResult.AuthenticationResult.AccessToken
      };
      const userResult = await cognitoISP.getUser(userParams).promise();

      // Create user object
      const user = {
        username: userResult.Username,
        attributes: userResult.UserAttributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {})
      };

      // Store session in DynamoDB
      try {
        await dynamoDb.update({
          TableName: TABLES.USERS,
          Key: { userId: user.username },
          UpdateExpression: 'SET #sess = :session, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#sess': 'session'
          },
          ExpressionAttributeValues: {
            ':session': sessionToken,
            ':updatedAt': new Date().toISOString()
          }
        }).promise();
        
        console.log('Session stored in DynamoDB');
      } catch (dbError) {
        console.error('Error storing session in DynamoDB:', dbError);
        // Continue anyway - the user is still authenticated
      }

      return res.status(200).json({
        success: true,
        message: 'Successfully signed in',
        session: sessionToken,
        user
      });
    } catch (authError) {
      console.error('Authentication error:', authError);

      if (authError.code === 'UserNotConfirmedException') {
        return res.status(400).json({
          success: false,
          message: 'Your account has not been verified. Please check your email for a verification code.'
        });
      }

      if (authError.code === 'NotAuthorizedException') {
        return res.status(400).json({
          success: false,
          message: 'Incorrect email or password'
        });
      }

      if (authError.code === 'UserNotFoundException') {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email'
        });
      }

      throw authError;
    }
  } catch (error) {
    console.error('Sign in error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error signing in'
    });
  }
} 