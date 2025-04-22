import AWS from 'aws-sdk';
import axios from 'axios';

// AWS Config and Session Helper
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

  // Get collectionUid from query
  const { collectionUid } = req.query;
  if (!collectionUid) {
    return res.status(400).json({ success: false, message: 'Missing collectionUid parameter' });
  }

  // Authentication
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
  }

  let userId;
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
    userId = userResponse.Items[0].userId;
    console.log(`fetch-history-item API: Authenticated user: ${userId}`);
  } catch (authError) {
    console.error('fetch-history-item API - Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }

  try {
    // First, verify the user owns this collection (security check)
    const getUserParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "generatedReviewHistory"
    };

    const userData = await dynamoDb.get(getUserParams).promise();
    
    if (!userData.Item || !userData.Item.generatedReviewHistory) {
      return res.status(404).json({ success: false, message: 'No history found for this user' });
    }

    // Check if this collectionUid exists in the user's history
    const historyItem = userData.Item.generatedReviewHistory.find(
      item => item.collectionUid === collectionUid
    );

    if (!historyItem) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this collection or collection not found' 
      });
    }

    // Fetch the collection details from Bannerbear
    const bannerbearResponse = await axios.get(
      `https://api.bannerbear.com/v2/collections/${collectionUid}`,
      {
        headers: {
          'Authorization': `Bearer ${BANNERBEAR_API_KEY}`
        }
      }
    );

    return res.status(200).json({
      success: true,
      bannerbearCollection: bannerbearResponse.data
    });

  } catch (error) {
    console.error(`Error fetching history item for collection ${collectionUid}:`, error);
    
    // Handle Bannerbear specific errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ 
        success: false, 
        message: 'Collection not found in Bannerbear'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching history item',
      error: error.message
    });
  }
} 