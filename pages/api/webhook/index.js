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

export default function handler(req, res) {
  // For initial webhook verification, just return a simple success response
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Test endpoint is working' });
  }

  // Once verified, we'll add back the POST handling code
  if (req.method === 'POST') {
    return res.status(200).json({ message: 'Webhook received' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 