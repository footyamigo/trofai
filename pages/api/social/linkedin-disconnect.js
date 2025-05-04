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
    if (req.method !== 'POST') { // Should be POST to perform an action
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    let userId = null;

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
        userId = userResponse.Items[0].userId;
        console.log(`LinkedIn Disconnect: Session valid for user ${userId}`);

        // 2. Prepare UpdateCommand to REMOVE LinkedIn attributes
        const params = {
            TableName: tables.users.tableName,
            Key: { userId: userId },
            // Use the REMOVE action for LinkedIn fields
            UpdateExpression: 'REMOVE linkedinUrn, linkedinAccessToken, linkedinTokenExpiry, linkedinName, linkedinProfilePic, linkedinConnectedAt',
            // We don't necessarily need ExpressionAttributeNames for REMOVE unless names conflict with reserved words
            ReturnValues: 'UPDATED_NEW', // Or 'NONE' if we don't need the result
        };
        
        // 3. Execute the update command
        console.log(`Removing LinkedIn connection details for user ${userId}...`);
        const updateResult = await dynamoDb.update(params.TableName, params.Key, {
            UpdateExpression: params.UpdateExpression,
            ReturnValues: params.ReturnValues
        });
        // Log attributes *before* they were removed if UPDATED_OLD was used, or just confirm success
        console.log(`Successfully removed LinkedIn details for user ${userId}`);

        // 4. Return success response
        return res.status(200).json({ 
            success: true, 
            message: 'LinkedIn account disconnected successfully.' 
        });

    } catch (error) {
        console.error(`Error disconnecting LinkedIn for user ${userId || 'UNKNOWN'}:`, error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to disconnect LinkedIn account.' 
        });
    }
} 