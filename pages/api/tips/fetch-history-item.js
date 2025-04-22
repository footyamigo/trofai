import fetch from 'node-fetch';
import AWS from 'aws-sdk'; // For authentication if needed

// AWS Config and Session Helper (Optional but good practice)
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';

const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;

const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // --- Authentication (Optional but recommended) ---
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
  }

  try {
      const userResponse = await dynamoDb.query({
          TableName: USERS_TABLE,
          IndexName: SESSION_INDEX,
          KeyConditionExpression: '#sess = :session',
          ExpressionAttributeNames: { '#sess': 'session' },
          ExpressionAttributeValues: { ':session': session }
      }).promise();

      if (!userResponse.Items || userResponse.Items.length === 0) {
          console.log('fetch-history-item API: Invalid session');
          return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
      }
      // We don't strictly need userId here, but it confirms auth
      console.log(`fetch-history-item API: Authenticated user: ${userResponse.Items[0].userId}`);
  } catch (authError) {
      console.error('fetch-history-item API - Authentication error:', authError);
      return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
  // --- End Authentication ---

  const { collectionUid } = req.query;

  if (!collectionUid || typeof collectionUid !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid collectionUid query parameter.' });
  }

  if (!BANNERBEAR_API_KEY) {
    console.error('BANNERBEAR_API_KEY is not configured.');
    return res.status(500).json({ success: false, message: 'Internal Server Error - Configuration missing.' });
  }

  try {
    console.log(`Fetching Bannerbear collection details for UID: ${collectionUid}`);
    const bbApiUrl = `https://api.bannerbear.com/v2/collections/${collectionUid}`;

    const response = await fetch(bbApiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Bannerbear API Error (${response.status}) fetching collection ${collectionUid}:`, data);
      const errorMessage = data?.message || `Failed to fetch collection (${response.statusText})`;
      // Distinguish between not found and other errors
      if (response.status === 404) {
           return res.status(404).json({ success: false, message: 'Bannerbear collection not found.' });
      }
      return res.status(response.status).json({ success: false, message: errorMessage });
    }

    // Return the full Bannerbear collection data
    return res.status(200).json({ success: true, bannerbearCollection: data });

  } catch (error) {
    console.error(`[FETCH_HISTORY_ITEM] Error fetching collection ${collectionUid}:`, error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
} 