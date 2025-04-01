const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const cors = require('cors');

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

// Create DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'trofai-image-status';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'Webhook server is running' });
});

// GET endpoint for verification
app.get('/webhook', (req, res) => {
  console.log('GET request received for webhook verification');
  res.status(200).json({ message: 'Webhook endpoint is active' });
});

// POST endpoint for actual webhook data
app.post('/webhook', async (req, res) => {
  try {
    console.log('POST request received for webhook', {
      headers: req.headers,
      body: req.body
    });
    
    // Verify webhook secret
    const authHeader = req.headers.authorization;
    const WEBHOOK_SECRET = process.env.BANNERBEAR_WEBHOOK_SECRET;
    
    if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error('Unauthorized webhook request - invalid secret');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const webhookData = req.body;
    
    // Store in DynamoDB
    if (webhookData && webhookData.uid) {
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
        
        console.log('Collection data received', {
          uid: webhookData.uid,
          status: webhookData.status,
          images: (webhookData.images || []).length,
          imageUrls: Object.keys(webhookData.image_urls || {}).length
        });
      } else {
        // For single images
        status.image_url = webhookData.image_url;
        status.image_url_png = webhookData.image_url_png;
        status.image_url_jpg = webhookData.image_url_jpg;
        
        console.log('Single image data received', {
          uid: webhookData.uid,
          status: webhookData.status
        });
      }
      
      // Save to DynamoDB
      try {
        await dynamoDB.put({
          TableName: TABLE_NAME,
          Item: {
            ...status,
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
          }
        }).promise();
        console.log('Successfully saved webhook data to DynamoDB for uid:', webhookData.uid);
      } catch (dbError) {
        console.error('Error saving to DynamoDB:', dbError);
      }
    } else {
      console.warn('Invalid webhook data - missing uid');
    }
    
    // Send response - always return 200 OK to Bannerbear
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to avoid Bannerbear retries for server errors
    res.status(200).json({ message: 'Webhook received with errors' });
  }
});

// Status endpoint
app.get('/status/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Get status from DynamoDB
    const result = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { uid }
    }).promise();
    
    if (!result.Item) {
      return res.status(404).json({ message: 'Status not found' });
    }
    
    res.status(200).json(result.Item);
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
  console.log('Environment variables:');
  console.log(`- PORT: ${process.env.PORT || '3000 (default)'}`);
  console.log(`- REGION: ${process.env.REGION || 'us-east-1 (default)'}`);
  console.log(`- ACCESS_KEY_ID: ${process.env.ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
  console.log(`- SECRET_ACCESS_KEY: ${process.env.SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
  console.log(`- BANNERBEAR_WEBHOOK_SECRET: ${process.env.BANNERBEAR_WEBHOOK_SECRET ? 'Set' : 'Not set'}`);
}); 