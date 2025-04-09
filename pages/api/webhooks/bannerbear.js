import { DynamoDB } from 'aws-sdk';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.BANNERBEAR_WEBHOOK_SECRET;
  const authHeader = req.headers.authorization;

  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const webhookData = req.body;
  console.log('Received webhook from Bannerbear:', JSON.stringify(webhookData, null, 2));
  console.log('Webhook metadata:', JSON.stringify(webhookData.metadata, null, 2));
  
  // Check for various property ID formats in metadata
  const propertyId = webhookData.metadata?.propertyId || webhookData.metadata?.property_id;
  console.log('Extracted propertyId:', propertyId);

  if (webhookData.status === 'completed') {
    try {
      // Get the property ID from metadata
      if (!propertyId) {
        console.error('No propertyId in webhook metadata');
        return res.status(400).json({ error: 'No propertyId in metadata' });
      }

      console.log('Updating DynamoDB for property:', propertyId);
      console.log('Webhook has images:', webhookData.images?.length || 0);
      console.log('Webhook has image_urls:', Object.keys(webhookData.image_urls || {}).length);
      console.log('Webhook has zip_url:', !!webhookData.zip_url);

      // Update the property content with the completed data
      await dynamoDb.update({
        TableName: TABLES.PROPERTY_CONTENT,
        Key: {
          id: propertyId
        },
        UpdateExpression: 'SET #status = :status, images = :images, updatedAt = :updatedAt, bannerbearResponse = :bannerbearResponse, zip_url = :zip_url, image_urls = :image_urls',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'completed',
          ':images': webhookData.images || [],
          ':updatedAt': new Date().toISOString(),
          ':bannerbearResponse': webhookData,
          ':zip_url': webhookData.zip_url || null,
          ':image_urls': webhookData.image_urls || {}
        }
      }).promise();

      console.log('Successfully updated property content for:', propertyId);
    } catch (error) {
      console.error('Error updating property content:', error);
      return res.status(500).json({ error: 'Failed to update property content' });
    }
  }

  res.status(200).json({ received: true });
} 