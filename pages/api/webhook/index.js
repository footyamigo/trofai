import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'trofai-image-status';

async function saveStatusToDynamo(status) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        uid: status.uid,
        ...status,
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      }
    };

    await dynamoDB.put(params).promise();
    console.log('Successfully saved status to DynamoDB:', status.uid);
  } catch (error) {
    console.error('Error saving status to DynamoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // For initial webhook verification, just return a simple success response
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Test endpoint is working' });
  }

  // Handle POST request for webhook data
  if (req.method === 'POST') {
    try {
      // Log incoming webhook data
      console.log('Received webhook data:', {
        headers: req.headers,
        body: req.body
      });

      // Verify webhook secret
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.BANNERBEAR_WEBHOOK_SECRET}`) {
        console.error('Unauthorized webhook request:', { authHeader });
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const webhookData = req.body;
      
      if (!webhookData.uid) {
        console.error('Missing UID in webhook data');
        return res.status(400).json({ message: 'Missing UID in webhook data' });
      }

      // Store the status update
      const status = {
        type: webhookData.template_set ? 'collection' : 'single',
        status: webhookData.status,
        uid: webhookData.uid,
        event: webhookData.event,
        timestamp: new Date().toISOString()
      };

      if (status.type === 'collection') {
        // For collections, store both image_urls and images array
        status.image_urls = webhookData.image_urls || {};
        status.images = webhookData.images || [];
        status.template_set = webhookData.template_set;
        status.zip_url = webhookData.zip_url;

        console.log('Collection status update:', {
          uid: webhookData.uid,
          status: status.status,
          imageCount: Object.keys(status.image_urls || {}).length,
          images: status.images
        });
      } else {
        status.image_url = webhookData.image_url;
        status.image_url_png = webhookData.image_url_png;
        status.image_url_jpg = webhookData.image_url_jpg;

        console.log('Image status update:', {
          uid: webhookData.uid,
          status: status.status,
          image_url: status.image_url
        });
      }

      await saveStatusToDynamo(status);
      console.log('Successfully saved status to DynamoDB:', webhookData.uid);

      // Return success response
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 