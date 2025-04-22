import AWS from 'aws-sdk';

// AWS Config and Session Helper
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';

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
      console.log('fetch-history API: Invalid session');
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userId = userResponse.Items[0].userId;
    console.log(`fetch-history API: Authenticated user: ${userId}`);
  } catch (authError) {
    console.error('fetch-history API - Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }

  try {
    // Get user by ID and fetch their generatedReviewHistory
    const getUserParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "generatedReviewHistory"
    };

    const userData = await dynamoDb.get(getUserParams).promise();
    let history = [];

    if (userData.Item && userData.Item.generatedReviewHistory) {
      history = userData.Item.generatedReviewHistory;
      // Sort history to newest first
      history.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA; // Descending order
      });
    }

    console.log(`Fetched ${history.length} review history items for user ${userId}`);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error(`Error fetching user review history for userId ${userId}:`, error);
    return res.status(500).json({ success: false, message: 'Error fetching review history' });
  }
} 