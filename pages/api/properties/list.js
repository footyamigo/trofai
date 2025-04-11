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
  USERS: 'trofai-users'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the session token
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      console.log('No session token provided');
      return res.status(401).json({ message: 'Unauthorized - No session provided' });
    }

    console.log('Validating session token');
    
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
      console.log('Invalid session token - no user found');
      return res.status(401).json({ message: 'Unauthorized - Invalid session' });
    }

    const userId = userResponse.Items[0].userId;
    const userEmail = userResponse.Items[0].email || userResponse.Items[0].username || 'Unknown';
    
    console.log(`Fetching properties for user: ${userEmail} (${userId})`);

    // Query properties by user ID
    const propertiesResponse = await dynamoDb.query({
      TableName: TABLES.PROPERTIES,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Get newest first
    }).promise();

    // Check if properties were found and log the count
    const propertyCount = propertiesResponse.Items ? propertiesResponse.Items.length : 0;
    console.log(`Found ${propertyCount} properties for user ${userId}`);

    // Format the response
    const properties = propertiesResponse.Items.map(item => ({
      propertyId: item.propertyId,
      url: item.url,
      address: item.address || item.data?.property?.address || 'Unknown Address',
      price: item.price || item.data?.property?.price || 'Price not available',
      bedrooms: item.bedrooms || item.data?.property?.bedrooms || '',
      bathrooms: item.bathrooms || item.data?.property?.bathrooms || '',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      images: item.data?.property?.images || [],
      status: item.status || 'completed'
    }));

    return res.status(200).json({
      success: true,
      properties,
      count: properties.length,
      user: {
        id: userId,
        email: userEmail
      }
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching properties',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 