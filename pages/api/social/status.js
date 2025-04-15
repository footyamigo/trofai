import { usersDb } from '../../../src/aws/dynamoDb'; // Use the same DB helper

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer '
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let userId = null;
  let userData = null;

  try {
    // 1. Get session token from header
    const session = getSessionFromHeader(req);

    if (!session) {
      console.log('Status check: No session token provided in header');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // 2. Validate session token by looking up user in DynamoDB
    // Assuming usersDb has a method to query by session, or we adapt the logic
    // from validate-session.js (using the generic query method)
    console.log('Status check: Validating session via DynamoDB...');
    const userResponse = await usersDb.query(usersDb.tables.users.tableName, {
        IndexName: 'SessionIndex', // Use the correct index name from your schema
        KeyConditionExpression: '#sess = :session',
        ExpressionAttributeNames: {
            '#sess': 'session'
        },
        ExpressionAttributeValues: {
            ':session': session
        }
    });

    if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
        console.log('Status check: Invalid session token (no user found)');
        return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    userData = userResponse.Items[0];
    userId = userData.userId; // Extract userId from the fetched user data
    console.log(`Status check: Session valid for user ${userId}`);

    // 3. Determine connection status from the fetched userData
    const isFacebookConnected = !!userData?.facebookUserId; // Check if facebookUserId exists
    const isInstagramConnected = !!userData?.instagramUserId; // Placeholder

    // 4. Return Status
    return res.status(200).json({
      success: true,
      connections: {
        facebook: isFacebookConnected,
        instagram: isInstagramConnected,
      },
    });

  } catch (error) {
    console.error('Error fetching social connection status:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while fetching status.',
      error: error.message,
    });
  }
} 