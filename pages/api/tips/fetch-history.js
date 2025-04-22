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

  // Fetch History
  try {
    console.log(`Fetching generated advice history for userId: ${userId}`);
    const params = {
      TableName: USERS_TABLE,
      Key: { userId },
    };
    const data = await dynamoDb.get(params).promise();
    
    // Return history array (empty if not found), ensuring newest items are first
    const history = data.Item?.generatedAdviceHistory || [];
    // Add a check to ensure captions are present in fetched data
    console.log(`Fetched ${history.length} history items. First item keys:`, history.length > 0 ? Object.keys(history[0]) : 'N/A');
    history.reverse(); // Display newest first

    return res.status(200).json({ success: true, history: history });

  } catch (error) {
    console.error(`Error fetching advice history for userId ${userId}:`, error);
    return res.status(500).json({ success: false, message: 'Error fetching advice history.' });
  }
} 