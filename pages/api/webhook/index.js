import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export default async function handler(req, res) {
  // Handle GET request for webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Test endpoint is working' });
  }

  // Handle POST request for webhook data
  if (req.method === 'POST') {
    console.log('Received webhook data:', JSON.stringify(req.body, null, 2));

    // Verify webhook secret
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.BANNERBEAR_WEBHOOK_SECRET}`) {
      console.error('Unauthorized webhook request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const webhookData = req.body;
      const { uid, event } = webhookData;

      if (!uid) {
        console.error('Missing UID in webhook data');
        return res.status(400).json({ message: 'Missing UID' });
      }

      // Store the status update in DynamoDB
      const timestamp = Math.floor(Date.now() / 1000);
      const ttl = timestamp + (7 * 24 * 60 * 60); // 7 days TTL

      const item = {
        uid,
        event,
        status: webhookData.status,
        created_at: timestamp,
        ttl,
        data: webhookData
      };

      // For template sets, we'll store additional information
      if (event === 'COLLECTION_CREATED') {
        item.images = webhookData.images;
        item.total_images = webhookData.images?.length || 0;
      }

      await docClient.send(
        new PutCommand({
          TableName: "trofai-image-status",
          Item: item
        })
      );

      console.log('Successfully stored webhook data:', item);
      return res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ message: 'Error processing webhook' });
    }
  }

  // Handle other HTTP methods
  return res.status(405).json({ message: 'Method not allowed' });
} 