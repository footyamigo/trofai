import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb'; // Use the same DB helper
import tables from '../../../src/aws/dynamoDbSchema'; // Import the schema definition

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
    // 1. Get session token from header and validate
    const session = getSessionFromHeader(req);
    if (!session) {
      // Return status as not connected if no token
      return res.status(200).json({ 
        success: true, 
        connections: { facebook: false, instagram: false, linkedin: false } 
      });
    }

    console.log('Status check: Validating session via DynamoDB...');
    const userResponse = await dynamoDb.query(tables.users.tableName, { 
        IndexName: tables.users.indexes.bySession.indexName,
        KeyConditionExpression: '#sess = :session',
        ExpressionAttributeNames: { '#sess': 'session' },
        ExpressionAttributeValues: { ':session': session }
    });

    if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
        // Return status as not connected if session invalid
        return res.status(200).json({ 
            success: true, 
            connections: { facebook: false, instagram: false, linkedin: false } 
        });
    }

    userData = userResponse.Items[0];
    userId = userData.userId;
    console.log(`Status check: Session valid for user ${userId}`);

    // 2. Determine connection status AND get names from userData
    const isFacebookConnected = !!userData?.facebookPageId; // Use pageId as definitive check
    const facebookPageName = userData?.facebookPageName || null; // Get page name
    
    const isInstagramConnected = !!userData?.instagramUserId; // Use igUserId as check
    const instagramUsername = userData?.instagramUsername || null; // Get username

    // Add LinkedIn status check
    const isLinkedInConnected = !!userData?.linkedinUrn; // Use linkedinUrn or linkedinAccessToken as check
    const linkedinName = userData?.linkedinName || null; // Get LinkedIn name

    // 3. Return Status including names
    return res.status(200).json({
      success: true,
      connections: {
        facebook: isFacebookConnected,
        facebookPageName: facebookPageName, // Include page name
        instagram: isInstagramConnected,
        instagramUsername: instagramUsername, // Include username
        // Add LinkedIn status and name to the response
        linkedin: isLinkedInConnected,
        linkedinName: linkedinName,
      },
    });

  } catch (error) {
    console.error('Error fetching social connection status:', error);
    // Return disconnected status on error
    return res.status(200).json({ 
        success: true, // Request succeeded, but status is 'disconnected' due to error
        connections: { facebook: false, instagram: false, linkedin: false },
        error: 'Failed to retrieve connection status.' // Optional error info
     }); 
  }
} 