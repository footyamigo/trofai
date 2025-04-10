const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const cors = require('cors');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create DynamoDB client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'trofai-image-status';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// GET endpoint for verification
app.get('/webhook', (req, res) => {
  console.log('GET request received for webhook verification');
  res.status(200).json({ message: 'Webhook endpoint is active' });
});

// POST endpoint for actual webhook data
app.post('/webhook', async (req, res) => {
  try {
    console.log('POST request received for webhook:', req.body);
    
    // Verify webhook secret
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer bb_wh_b8925dda9f9bcdd3988515e8a85d69`) {
      console.error('Unauthorized webhook request');
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
        status.image_urls = webhookData.image_urls || {};
        status.images = webhookData.images || [];
        status.template_set = webhookData.template_set;
        status.zip_url = webhookData.zip_url;
      } else {
        status.image_url = webhookData.image_url;
        status.image_url_png = webhookData.image_url_png;
        status.image_url_jpg = webhookData.image_url_jpg;
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
        console.log('Successfully saved webhook data to DynamoDB');
      } catch (dbError) {
        console.error('Error saving to DynamoDB:', dbError);
      }
    }
    
    // Send response
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
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
  console.log('Use ngrok (https://ngrok.com) to expose this server to the internet:');
  console.log(`ngrok http ${PORT}`);
}); 