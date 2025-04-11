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
  USERS: 'trofai-users',
  PROPERTIES: 'trofai-properties'
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the property ID from the query
    const { propertyId } = req.query;
    if (!propertyId) {
      console.error('Property ID is missing in request query');
      return res.status(400).json({ 
        error: 'Property ID is required',
        details: 'The propertyId parameter was not provided in the request'
      });
    }

    console.log('Fetching property content for ID:', propertyId);

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
    console.log('Validated user ID:', userId);

    // Fetch the property content from DynamoDB
    const result = await dynamoDb.get({
      TableName: TABLES.PROPERTY_CONTENT,
      Key: {
        id: propertyId
      }
    }).promise();

    if (!result.Item) {
      console.error('Property not found in PROPERTY_CONTENT table with ID:', propertyId);
      
      // Try to find it in the PROPERTIES table as fallback
      const propertiesResult = await dynamoDb.query({
        TableName: TABLES.PROPERTIES,
        KeyConditionExpression: 'propertyId = :propertyId',
        ExpressionAttributeValues: {
          ':propertyId': propertyId
        }
      }).promise();
      
      if (!propertiesResult.Items || propertiesResult.Items.length === 0) {
        return res.status(404).json({ 
          error: 'Property content not found',
          details: `No property found with ID: ${propertyId}`
        });
      }
      
      // We found it in the PROPERTIES table, use that data
      const propertyItem = propertiesResult.Items[0];
      
      // Try to extract caption from the property data
      let captionFromProperty = '';
      if (propertyItem.caption) {
        captionFromProperty = propertyItem.caption;
      } else if (propertyItem.data && propertyItem.data.caption) {
        captionFromProperty = propertyItem.data.caption;
      } else if (propertyItem.data && propertyItem.data.raw && propertyItem.data.raw.caption) {
        captionFromProperty = propertyItem.data.raw.caption;
      }
      
      console.log('Found property in PROPERTIES table, caption available:', !!captionFromProperty);
      
      return res.status(200).json({
        data: {
          status: 'completed',
          images: [],
          bannerbear: {
            uid: null,
            status: 'completed',
            template_set: null
          },
          caption: captionFromProperty,
          captionOptions: {},
          zip_url: null,
          image_urls: {},
          propertyData: {
            property: {
              ...propertyItem.data,
              id: propertyItem.propertyId,
              address: propertyItem.address || propertyItem.data?.property?.address || '',
              price: propertyItem.price || propertyItem.data?.property?.price || '',
              bedrooms: propertyItem.bedrooms || propertyItem.data?.property?.bedrooms || '',
              bathrooms: propertyItem.bathrooms || propertyItem.data?.property?.bathrooms || ''
            }
          }
        }
      });
    }

    console.log('Found property in database with keys:', Object.keys(result.Item));

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

    // Safely extract data with fallbacks for each field
    const propertyData = result.Item.propertyData || {};
    const bannerbear = result.Item.bannerbear || {};
    const images = result.Item.images || [];
    const status = result.Item.status || 'completed';
    
    // Get caption from all possible sources in the database
    const caption = result.Item.caption || 
                   propertyData.caption || 
                   (propertyData.raw && propertyData.raw.caption) || 
                   '';
    
    console.log('Caption sources available:', {
      directCaption: !!result.Item.caption,
      propertyDataCaption: !!propertyData.caption,
      rawCaption: !!(propertyData.raw && propertyData.raw.caption)
    });
    
    const captionOptions = result.Item.captionOptions || {};
    const zipUrl = result.Item.zip_url || null;
    const imageUrls = result.Item.image_urls || {};

    // Return the property content with better structure and fallbacks
    return res.status(200).json({
      data: {
        status: status,
        images: images,
        bannerbear: {
          uid: bannerbear.uid || null,
          status: bannerbear.status || 'completed',
          template_set: bannerbear.template_set || null
        },
        caption: caption,
        captionOptions: captionOptions,
        zip_url: zipUrl,
        image_urls: imageUrls,
        propertyData: {
          property: {
            ...propertyData,
            id: result.Item.id,
            address: propertyData.property?.address || result.Item.address || '',
            price: propertyData.property?.price || result.Item.price || '',
            bedrooms: propertyData.property?.bedrooms || '',
            bathrooms: propertyData.property?.bathrooms || ''
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching property content:', error);
    return res.status(500).json({ error: 'Failed to fetch property content' });
  }
} 