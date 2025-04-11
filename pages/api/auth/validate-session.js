import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define tables
const TABLES = {
  USERS: 'trofai-users'
};

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

    console.log('Validating session token');
    
    // Look up the user associated with this session in DynamoDB
    const userResponse = await dynamoDb.query({
      TableName: TABLES.USERS,
      IndexName: 'SessionIndex',
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: {
        '#sess': 'session'
      },
      ExpressionAttributeValues: {
        ':session': session
      }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      console.log('Invalid session - no matching user found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session token' 
      });
    }

    const user = userResponse.Items[0];
    console.log(`Session validated for user: ${user.email || user.username}`);
    
    // Return the actual user data
    return res.status(200).json({
      userId: user.userId,
      username: user.username || user.email,
      email: user.email || user.username,
      attributes: {
        email: user.email || user.username,
        name: user.fullName || user.name || 'User'
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error validating session'
    });
  }
} 