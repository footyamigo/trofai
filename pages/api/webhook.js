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

async function saveStatus(status) {
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

async function getStatus(uid) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { uid }
    };

    const result = await dynamoDB.get(params).promise();
    console.log('Successfully retrieved status from DynamoDB:', uid);
    return result.Item;
  } catch (error) {
    console.error('Error getting status from DynamoDB:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log request headers for debugging
    console.log('Webhook request headers:', JSON.stringify(req.headers, null, 2));

    // Verify webhook secret
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.BANNERBEAR_WEBHOOK_SECRET}`) {
      console.error('Unauthorized webhook request:', { authHeader });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const webhookData = req.body;
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));

    if (!webhookData.uid) {
      console.error('Missing UID in webhook data');
      return res.status(400).json({ message: 'Missing UID in webhook data' });
    }

    // Store the status update
    const status = {
      type: webhookData.template_set ? 'collection' : 'single',
      status: webhookData.status,
      uid: webhookData.uid,
      timestamp: new Date().toISOString()
    };

    if (status.type === 'collection') {
      // For collections, store both image_urls and images array
      status.image_urls = webhookData.image_urls || {};
      status.images = webhookData.images || [];
      status.template_set = webhookData.template_set;
      status.zip_url = webhookData.zip_url;

      // Log collection status update
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
    }

    await saveStatus(status);
    console.log('Updated status for UID:', webhookData.uid, status);

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

// API endpoint to get status
export async function GET(req, res) {
  const { uid } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  try {
    const status = await getStatus(uid);
    if (!status) {
      return res.status(404).json({ message: 'Status not found' });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Add endpoint to list all statuses (useful for debugging)
export async function listStatuses(req, res) {
    const statuses = Array.from(statusMap.entries()).map(([uid, data]) => ({
        uid,
        ...data
    }));

    return res.status(200).json(statuses);
} 