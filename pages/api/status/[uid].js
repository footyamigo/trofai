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

async function getStatus(uid) {
  const params = {
    TableName: TABLE_NAME,
    Key: { uid }
  };

  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 