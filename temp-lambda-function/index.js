const AWS = require('aws-sdk');

// Configure AWS with more robust error handling
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const AWS_REGION = process.env.REGION || 'us-east-1';
const WEBHOOK_SECRET = process.env.BANNERBEAR_WEBHOOK_SECRET;

console.log('Lambda function initialized');

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

// Extremely simplified handler that always returns 200 OK
exports.handler = async (event) => {
  console.log('Lambda function invoked');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK' }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
  };
}; 