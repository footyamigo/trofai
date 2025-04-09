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
  const action = req.query.action || 'test';
  
  try {
    // Return all environment variables related to AWS Cognito
    const cognitoConfig = {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
      userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '[REDACTED]' : 'not set',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '[REDACTED]' : 'not set',
      awsRegion: process.env.AWS_REGION,
    };

    // Check that AWS SDK is configured correctly
    let authStatus = 'Unknown';
    let userPoolDetails = null;
    let users = null;
    
    // Make sure we have a User Pool ID
    if (!process.env.NEXT_PUBLIC_USER_POOL_ID) {
      return res.status(400).json({
        success: false,
        message: 'Missing User Pool ID in environment variables',
        cognitoConfig
      });
    }
    
    try {
      // Test if cognitoISP is available
      if (cognitoISP && typeof cognitoISP.listUsers === 'function') {
        authStatus = 'Available';
        
        if (action === 'test') {
          // Get user pool details
          const userPoolResponse = await cognitoISP.describeUserPool({
            UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID
          }).promise();
          
          userPoolDetails = {
            id: userPoolResponse.UserPool.Id,
            name: userPoolResponse.UserPool.Name,
            status: userPoolResponse.UserPool.Status,
            creationDate: userPoolResponse.UserPool.CreationDate,
            emailConfiguration: userPoolResponse.UserPool.EmailConfiguration || 'Default'
          };
          
          authStatus = 'Connected and working';
        } else if (action === 'listUsers') {
          // List users in the user pool
          const params = {
            UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
            Limit: 10  // Limit to 10 users for safety
          };
          
          const usersResponse = await cognitoISP.listUsers(params).promise();
          users = usersResponse.Users.map(user => ({
            username: user.Username,
            created: user.UserCreateDate,
            status: user.UserStatus,
            email: user.Attributes.find(attr => attr.Name === 'email')?.Value || 'No email'
          }));
          
          authStatus = 'Listed users successfully';
        }
      } else {
        authStatus = 'AWS SDK not properly initialized';
      }
    } catch (error) {
      console.error('AWS SDK error:', error);
      authStatus = `Error: ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      cognitoConfig,
      authStatus,
      sdkVersion: AWS.VERSION,
      userPoolDetails,
      users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred',
      error: error.toString()
    });
  }
} 