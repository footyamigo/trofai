import { DynamoDB, CognitoIdentityServiceProvider } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const cognito = new CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLES = {
  PROPERTY_CONTENT: 'trofai-property-content'
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

    // For now, skip authentication and just fetch the data
    // We can add proper authentication back once the basic functionality works
    console.log('Fetching property:', propertyId);

    // Fetch the property content from DynamoDB
    const result = await dynamoDb.get({
      TableName: TABLES.PROPERTY_CONTENT,
      Key: {
        id: propertyId
      }
    }).promise();

    console.log('DynamoDB result:', result);

    if (!result.Item) {
      return res.status(404).json({ error: 'Property content not found' });
    }

    // Process bannerbear data
    const bannerbearData = result.Item.bannerbear || result.Item.bannerbearResponse || {};
    const status = result.Item.status || bannerbearData.status || 'completed';

    // Return the property content with proper structure
    return res.status(200).json({
      data: {
        id: result.Item.id,
        status: status,
        images: result.Item.images || [],
        bannerbear: {
          uid: bannerbearData.uid,
          status: status,
          image_urls: bannerbearData.image_urls || result.Item.image_urls || {},
          zip_url: bannerbearData.zip_url || result.Item.zip_url,
          raw: bannerbearData
        },
        caption: result.Item.caption || bannerbearData.caption || '',
        altCaption: result.Item.altCaption || result.Item.alternativeCaption || '',
        captionOptions: {
          main: result.Item.caption || bannerbearData.caption || '',
          alternative: result.Item.altCaption || result.Item.alternativeCaption || ''
        },
        propertyData: result.Item.propertyData || {},
        createdAt: result.Item.createdAt,
        updatedAt: result.Item.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching property content:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch property content',
      details: error.message 
    });
  }
} 