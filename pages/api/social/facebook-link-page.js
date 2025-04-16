import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';

// Load FB App Credentials (Still useful for potential future validation)
// const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
// const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Token exchange helper is removed from here

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
         if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        const userId = userResponse.Items[0].userId;
        console.log(`FB Link Page: Session valid for user ${userId}`);

        // 2. Get selected Page details and the LONG-LIVED FB user token from request body
        const { 
            fbPageId, 
            fbPageName, 
            fbPageAccessToken, 
            facebookUserId, 
            fbUserAccessToken, // This should now be the LONG-LIVED token 
            fbTokenExpiry      // Optional expiry timestamp
        } = req.body;
        
        // Validate required fields
        if (!fbPageId || !fbPageName || !fbPageAccessToken || !facebookUserId || !fbUserAccessToken) {
            return res.status(400).json({ success: false, message: 'Missing required Facebook Page details or long-lived user token' });
        }

        // 3. Prepare data to save (using the received long-lived token)
        const updateData = {
            facebookUserId: facebookUserId, 
            facebookPageId: fbPageId,
            facebookPageName: fbPageName,
            facebookPageAccessToken: fbPageAccessToken, // Page token 
            facebookUserAccessToken: fbUserAccessToken, // Store the long-lived USER token
            facebookTokenExpiry: fbTokenExpiry || null, // Store expiry time if provided
            facebookConnectedAt: new Date().toISOString(),
        };

        // 4. Save to DynamoDB
        console.log(`Linking Facebook Page ${fbPageId} (${fbPageName}) for user ${userId}.`);
        await usersDb.updateUser(userId, updateData);
        console.log(`Successfully linked Facebook Page ${fbPageId} for user ${userId}`);

        // 5. Return Success
        return res.status(200).json({ 
            success: true, 
            message: `Facebook Page (${fbPageName}) linked successfully.` 
        });

    } catch (error) {
        console.error('Error linking Facebook Page:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while linking the Facebook Page.',
        });
    }
} 