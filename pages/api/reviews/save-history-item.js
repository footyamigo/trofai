import AWS from 'aws-sdk';

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // 1. Authentication
  const session = req.headers.authorization?.replace('Bearer ', '');
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session provided' });
  }

  let userData;
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: 'SessionIndex',
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: {
        '#sess': 'session'
      },
      ExpressionAttributeValues: {
        ':session': session
      }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0];
    console.log(`Save History: User ${userData.userId} authenticated.`);

  } catch (dbError) {
    console.error("Save History: DynamoDB user fetch error:", dbError);
    return res.status(500).json({ success: false, message: 'Error authenticating user.' });
  }

  // 2. Get History Item from Request Body
  const historyItem = req.body;
  if (!historyItem || !historyItem.timestamp || !historyItem.reviewText || !historyItem.collectionUid) {
    console.error("Save History: Invalid history item received:", historyItem);
    return res.status(400).json({ success: false, message: 'Invalid or incomplete history item data provided.' });
  }
  console.log(`Save History: Received item with timestamp ${historyItem.timestamp}`);

  // 3. Save to DynamoDB
  try {
    // Get current history array or initialize new one
    const getUserParams = {
      TableName: USERS_TABLE,
      Key: { userId: userData.userId },
      ProjectionExpression: "generatedReviewHistory"
    };
    
    const userHistoryData = await dynamoDb.get(getUserParams).promise();
    const currentHistory = userHistoryData.Item?.generatedReviewHistory || [];
    
    // Add new item to the beginning of the array
    // (Consider adding a check here to prevent duplicates if necessary, based on timestamp or collectionUid)
    const newHistory = [historyItem, ...currentHistory];
    
    // Update DynamoDB
    const updateParams = {
      TableName: USERS_TABLE,
      Key: { userId: userData.userId },
      UpdateExpression: "SET #history = :history",
      ExpressionAttributeNames: {
        "#history": "generatedReviewHistory"
      },
      ExpressionAttributeValues: {
        ":history": newHistory
      }
    };
    
    await dynamoDb.update(updateParams).promise();
    console.log(`Save History: Successfully saved review to history for user ${userData.userId}`);
    return res.status(200).json({ success: true, message: 'History item saved successfully.' });

  } catch (saveError) {
    console.error("Save History: Error updating DynamoDB:", saveError);
    return res.status(500).json({ success: false, message: 'Failed to save history item to database.' });
  }
} 