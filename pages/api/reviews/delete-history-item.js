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
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
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
      console.log('delete-history-item API: Invalid session');
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userId = userResponse.Items[0].userId;
    console.log(`delete-history-item API: Authenticated user: ${userId}`);
  } catch (authError) {
    console.error('delete-history-item API - Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }

  // Get timestamp from request
  const { timestamp } = req.query;
  
  if (!timestamp) {
    return res.status(400).json({ success: false, message: 'Missing timestamp parameter' });
  }

  try {
    // First, get the current history array
    const getParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      ProjectionExpression: "generatedReviewHistory"
    };
    
    const userData = await dynamoDb.get(getParams).promise();
    const currentHistory = userData.Item?.generatedReviewHistory || [];
    
    // Find the index of the item to remove
    const itemIndex = currentHistory.findIndex(item => item.timestamp === timestamp);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'History item not found' });
    }
    
    // Remove the item
    const newHistory = [
      ...currentHistory.slice(0, itemIndex),
      ...currentHistory.slice(itemIndex + 1)
    ];
    
    // Update the user's history in DynamoDB
    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET #history = :history",
      ExpressionAttributeNames: {
        "#history": "generatedReviewHistory"
      },
      ExpressionAttributeValues: {
        ":history": newHistory
      },
      ReturnValues: "UPDATED_NEW"
    };
    
    await dynamoDb.update(updateParams).promise();
    console.log(`Successfully deleted history item with timestamp ${timestamp} for user ${userId}`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'History item deleted successfully' 
    });
    
  } catch (error) {
    console.error(`Error deleting history item for userId ${userId}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting history item',
      error: error.message
    });
  }
} 