import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define table names
const TABLES = {
  PROPERTIES: 'trofai-properties',
  USERS: 'trofai-users',
  PROPERTY_CONTENT: 'trofai-property-content'
};

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    // Get the user from the session token
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized - No session provided' });
    }

    // Validate session with DynamoDB
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
      return res.status(401).json({ message: 'Unauthorized - Invalid session' });
    }

    const userId = userResponse.Items[0].userId;

    // First, get the property to verify it belongs to the user
    const propertyResult = await dynamoDb.get({
      TableName: TABLES.PROPERTIES,
      Key: { 
        propertyId: propertyId,
        userId: userId
      }
    }).promise();

    if (!propertyResult.Item) {
      return res.status(404).json({ 
        message: 'Property not found or you do not have permission to delete it' 
      });
    }

    // Delete the property from the properties table
    await dynamoDb.delete({
      TableName: TABLES.PROPERTIES,
      Key: {
        propertyId: propertyId,
        userId: userId
      }
    }).promise();

    // Also delete from property content table if it exists
    try {
      await dynamoDb.delete({
        TableName: TABLES.PROPERTY_CONTENT,
        Key: {
          id: propertyId
        }
      }).promise();
    } catch (contentError) {
      console.warn('Content deletion failed or not found:', contentError);
      // Continue with the process even if content deletion fails
    }

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting property'
    });
  }
} 