import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

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
        console.log(`IG Link: Session valid for user ${userId}`);

        // 2. Get selected account details from request body
        const { igUserId, igUsername, fbPageId /* Add other fields if needed */ } = req.body;
        if (!igUserId || !igUsername || !fbPageId) {
            return res.status(400).json({ success: false, message: 'Missing required Instagram account details' });
        }

        // 3. Prepare data to save
        const updateData = {
            instagramUserId: igUserId,
            instagramUsername: igUsername,
            facebookPageIdForInstagram: fbPageId,
            // Potentially clear or update FB/Page access tokens here if needed/obtained
            instagramConnectedAt: new Date().toISOString(),
        };

        // 4. Save to DynamoDB
        console.log(`Linking Instagram account ${igUserId} for user ${userId}`);
        await usersDb.updateUser(userId, updateData);
        console.log(`Successfully linked Instagram account ${igUserId} for user ${userId}`);

        // 5. Return Success
        return res.status(200).json({ 
            success: true, 
            message: `Instagram account (${igUsername}) linked successfully.` 
        });

    } catch (error) {
        console.error('Error linking Instagram account:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while linking the Instagram account.',
        });
    }
} 