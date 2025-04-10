import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

const TABLES = {
  PROPERTY_CONTENT: 'trofai-property-content',
  USERS: 'trofai-users'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the property ID from the query
    const { propertyId } = req.query;
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
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

    // Fetch the property content from DynamoDB
    const result = await dynamoDb.get({
      TableName: TABLES.PROPERTY_CONTENT,
      Key: {
        id: propertyId
      }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'Property content not found' });
    }

    // Verify the user owns this property
    if (result.Item.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this property' });
    }

    // Check if we have any direct Bannerbear information
    if (result.Item.bannerbear && result.Item.bannerbear.uid) {
      // We have Bannerbear data, check if we need to fetch the latest status
      const bannerbearStatus = result.Item.bannerbear.status;
      
      // If not completed yet and we have a UID, check for updates
      if (bannerbearStatus !== 'completed' && result.Item.bannerbear.uid) {
        console.log('Property has pending Bannerbear status, updating response with data from item');
      }
    }

    // Return the property content
    return res.status(200).json({
      data: {
        status: result.Item.status || 'completed',
        images: result.Item.images || [],
        bannerbear: {
          uid: result.Item.bannerbear?.uid || null,
          status: result.Item.bannerbear?.status || 'completed',
          template_set: result.Item.bannerbear?.template_set || null
        },
        caption: result.Item.caption || '',
        captionOptions: result.Item.captionOptions || {},
        zip_url: result.Item.zip_url || null,
        image_urls: result.Item.image_urls || {},
        propertyData: {
          property: {
            ...result.Item.propertyData,
            id: result.Item.id
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching property content:', error);
    return res.status(500).json({ error: 'Failed to fetch property content' });
  }
} 