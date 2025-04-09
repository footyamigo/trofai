// Simple API endpoint to directly fetch data from Bannerbear API
// This bypasses the webhook and DynamoDB systems that weren't working
import { DynamoDB } from 'aws-sdk';

// Initialize DynamoDB
const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const TABLES = {
  PROPERTY_CONTENT: 'trofai-property-content'
};

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid, type, propertyId } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  const isCollection = type === 'collection';
  const apiPath = isCollection ? 'collections' : 'images';
  
  try {
    // Fetch directly from Bannerbear API
    console.log(`Fetching directly from Bannerbear API: ${apiPath}/${uid}`);
    
    const response = await fetch(`https://api.bannerbear.com/v2/${apiPath}/${uid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bannerbear API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        message: 'Error from Bannerbear API',
        status: response.status,
        error: errorText
      });
    }

    // Get the data
    const data = await response.json();
    
    // Log a summary of what we found
    if (isCollection) {
      console.log('Collection data summary:', {
        uid: data.uid,
        status: data.status,
        imageCount: Object.keys(data.image_urls || {}).length,
        imagesArrayCount: (data.images || []).length,
        hasZip: !!data.zip_url
      });
    } else {
      console.log('Image data summary:', {
        uid: data.uid,
        status: data.status,
        hasImageUrl: !!data.image_url,
        hasPngUrl: !!data.image_url_png,
        hasJpgUrl: !!data.image_url_jpg
      });
    }

    // If status is completed and we have a propertyId, update DynamoDB to ensure consistency
    if (data.status === 'completed' && propertyId) {
      try {
        console.log(`Updating DynamoDB for property ${propertyId} with completed Bannerbear data`);
        
        // Get current record to check status
        const { Item } = await dynamoDb.get({
          TableName: TABLES.PROPERTY_CONTENT,
          Key: { id: propertyId }
        }).promise();
        
        if (Item && Item.bannerbear?.status !== 'completed') {
          // Only update if current status is not already completed
          await dynamoDb.update({
            TableName: TABLES.PROPERTY_CONTENT,
            Key: { id: propertyId },
            UpdateExpression: 'SET bannerbear.#status = :status, images = :images, updatedAt = :updatedAt, bannerbearResponse = :bannerbearResponse, zip_url = :zip_url, image_urls = :image_urls',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':status': 'completed',
              ':images': data.images || [],
              ':updatedAt': new Date().toISOString(),
              ':bannerbearResponse': data,
              ':zip_url': data.zip_url || null,
              ':image_urls': data.image_urls || {}
            }
          }).promise();
          
          console.log(`Successfully updated DynamoDB for property ${propertyId}`);
        } else {
          console.log(`DynamoDB record for property ${propertyId} is already up to date`);
        }
      } catch (dbError) {
        console.error('Error updating DynamoDB:', dbError);
        // Continue even if DB update fails - we can still return the data
      }
    }

    // Send the full API response back to client
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from Bannerbear:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
} 