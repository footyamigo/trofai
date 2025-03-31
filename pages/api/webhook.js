import AWS from 'aws-sdk';

// Configure AWS with more robust error handling
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const AWS_REGION = process.env.REGION || 'us-east-1';
const WEBHOOK_SECRET = process.env.BANNERBEAR_WEBHOOK_SECRET;
const WEBHOOK_URL = process.env.BANNERBEAR_WEBHOOK_URL;

console.log('Webhook module loaded. Webhook URL:', WEBHOOK_URL ? WEBHOOK_URL.substring(0, 30) + '...' : 'NOT SET');

// Configure AWS
let dynamoDB;
try {
  AWS.config.update({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  });

  dynamoDB = new AWS.DynamoDB.DocumentClient();
  console.log('DynamoDB configured successfully');
} catch (error) {
  console.error('Failed to configure AWS/DynamoDB:', error);
}

const TABLE_NAME = 'trofai-image-status';

async function saveStatusToDynamo(status) {
  if (!dynamoDB) {
    console.error('DynamoDB not configured, cannot save status');
    return false;
  }
  
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
    return true;
  } catch (error) {
    console.error('Error saving status to DynamoDB:', error);
    return false;
  }
}

async function getStatusFromDynamo(uid) {
  if (!dynamoDB) {
    console.error('DynamoDB not configured, cannot get status');
    return null;
  }
  
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
    return null;
  }
}

export default async function handler(req, res) {
  // Log request details for debugging
  console.log('Webhook request received:', {
    method: req.method,
    headers: {
      ...req.headers,
      // Redact authorization header for security
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    },
    query: req.query,
    body: typeof req.body === 'object' ? 'Object present (not showing contents)' : 'No body'
  });

  // Handle GET request for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Webhook endpoint is active' });
  }

  // Handle POST request for actual webhook data
  if (req.method === 'POST') {
    try {
      // Verify webhook secret
      const authHeader = req.headers.authorization;
      
      // Detailed logging for auth header
      console.log('Auth header check:', {
        headerPresent: !!authHeader,
        expectedFormat: `Bearer ${WEBHOOK_SECRET ? WEBHOOK_SECRET.substring(0, 5) + '...' : 'NOT_SET'}`
      });
      
      if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        console.error('Unauthorized webhook request - auth header mismatch or missing');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const webhookData = req.body;
      console.log('Received webhook data type:', typeof webhookData);
      
      if (!webhookData || typeof webhookData !== 'object') {
        console.error('Invalid webhook data - not an object');
        return res.status(400).json({ message: 'Invalid webhook data format' });
      }
      
      // Log essential data without exposing all details
      console.log('Webhook data essentials:', {
        uid: webhookData.uid,
        type: webhookData.template_set ? 'collection' : 'single',
        status: webhookData.status,
        imagesCount: webhookData.template_set ? 
          (webhookData.images?.length || Object.keys(webhookData.image_urls || {}).length || 0) : 
          (webhookData.image_url ? 1 : 0)
      });

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
          imagesArray: status.images.length
        });
      } else {
        status.image_url = webhookData.image_url;
        status.image_url_png = webhookData.image_url_png;
        status.image_url_jpg = webhookData.image_url_jpg;
      }

      const saveResult = await saveStatusToDynamo(status);
      if (saveResult) {
        console.log('Updated status for UID:', webhookData.uid);
      } else {
        console.warn('Failed to save status to DynamoDB, continuing anyway');
      }

      return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message
      });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ message: 'Method not allowed' });
}

// Status query endpoint
export async function getStatus(req, res) {
  const { uid } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  try {
    const status = await getStatusFromDynamo(uid);
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