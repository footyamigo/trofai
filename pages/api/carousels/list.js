import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.REGION || 'us-east-1';
const CAROUSELS_TABLE_NAME = process.env.DYNAMODB_CAROUSELS_TABLE || 'trofai-carousels';
const USERS_TABLE_NAME = 'trofai-users';
const SESSION_INDEX_NAME = 'SessionIndex';

const dynamoDbClient = new DynamoDBClient({
  region: region,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Helper to extract Bearer token from Authorization header
const getSessionTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

async function getUserIdFromSessionToken(sessionToken) {
  if (!sessionToken) return null;
  try {
    const queryCommand = new QueryCommand({
      TableName: USERS_TABLE_NAME,
      IndexName: SESSION_INDEX_NAME,
      KeyConditionExpression: '#sessionAttr = :sessionVal',
      ExpressionAttributeNames: { '#sessionAttr': 'session' },
      ExpressionAttributeValues: { ':sessionVal': sessionToken },
    });
    const { Items } = await docClient.send(queryCommand);
    if (Items && Items.length > 0) {
      return Items[0].userId;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by session token:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const sessionToken = getSessionTokenFromHeader(req);
  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing session token.' });
  }

  const userId = await getUserIdFromSessionToken(sessionToken);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session token.' });
  }

  try {
    // Query carousels for this user using the UserIdIndex GSI
    const queryCommand = new QueryCommand({
      TableName: CAROUSELS_TABLE_NAME,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false, // false for descending order (newest first) on the GSI sort key (createdAt)
    });
    const { Items } = await docClient.send(queryCommand);
    // No need for client-side sort if GSI handles it and projects all attributes
    return res.status(200).json({ success: true, carousels: Items || [] });
  } catch (error) {
    console.error('Error fetching carousels:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch carousels.' });
  }
} 