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
        console.log(`IG Disconnect: Session valid for user ${userId}`);

        // 2. Prepare UpdateCommand to REMOVE Instagram attributes
        const params = {
            TableName: tables.users.tableName,
            Key: { userId: userId },
            // Use the REMOVE action for IG fields
            UpdateExpression: 'REMOVE instagramUserId, instagramUsername, facebookPageIdForInstagram, facebookPageAccessTokenForInstagram, instagramConnectedAt',
            ReturnValues: 'UPDATED_NEW', 
        };
        
        // 3. Execute the update command
        console.log(`Removing Instagram connection details for user ${userId}...`);
        const updateResult = await dynamoDb.update(params.TableName, params.Key, {
            UpdateExpression: params.UpdateExpression,
            ReturnValues: params.ReturnValues
        });
        console.log(`Successfully removed Instagram details for user ${userId}`, updateResult.Attributes);
        
        // 4. Return Success
        return res.status(200).json({ 
            success: true, 
            message: `Instagram connection removed successfully.` 
        });

    } catch (error) {
        console.error('Error disconnecting Instagram account:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while disconnecting Instagram.',
        });
    }
} 