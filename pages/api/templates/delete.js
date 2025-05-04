import fetch from 'node-fetch';
import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; 
const SESSION_INDEX = 'SessionIndex'; 

// Helper to extract token
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Helper function to delete a template from Bannerbear
async function deleteBannerbearTemplate(apiKey, uid) {
  const url = `https://api.bannerbear.com/v2/templates/${uid}`;
  console.log(`Deleting template from Bannerbear: ${uid}`);
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    // Consider 404 as success (already deleted)
    if (response.ok || response.status === 404) {
        console.log(`Bannerbear delete successful (or template not found) for UID: ${uid}, Status: ${response.status}`);
        return { success: true };
    }
    // Handle other errors
    const errorBody = await response.text();
    console.error(`Bannerbear API Error deleting template ${uid}: ${response.status} ${response.statusText}`, errorBody);
    return { success: false, error: `Bannerbear API Error: ${response.statusText}` };
  } catch (error) {
    console.error(`Network/other error deleting template ${uid}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

// Helper function to remove template UID from user's DynamoDB record
async function removeTemplateFromUser(userId, templateUid) {
  console.log(`Removing template UID ${templateUid} from user ${userId}'s duplicatedTemplateUids`);
  const params = {
    TableName: USERS_TABLE,
    Key: { userId },
    UpdateExpression: 'DELETE duplicatedTemplateUids :uid',
    ExpressionAttributeValues: {
      ':uid': dynamoDb.createSet([templateUid])
    },
    ConditionExpression: 'attribute_exists(duplicatedTemplateUids)', // Optional: only run if the set exists
    ReturnValues: 'UPDATED_OLD' // Optional: see what was deleted
  };

  try {
    const result = await dynamoDb.update(params).promise();
    console.log(`Successfully removed template UID ${templateUid} from user ${userId}. Previous values (if any):`, result.Attributes);
    return { success: true };
  } catch (error) {
    // Handle ConditionalCheckFailedException gracefully if the set or item didn't exist
    if (error.code === 'ConditionalCheckFailedException') {
        console.log(`Conditional check failed (template UID ${templateUid} likely not in set for user ${userId}). Treating as success.`);
        return { success: true }; // Or false depending on desired strictness
    }
    console.error(`Error removing template UID ${templateUid} from DynamoDB for user ${userId}:`, error);
    return { success: false, error: 'DynamoDB update failed' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { // Using POST as delete might have body
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- Authentication --- 
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session provided' });
  }

  let userId;
  let userDuplicatedUids = [];
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: SESSION_INDEX,
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userId = userResponse.Items[0].userId;
    if (userResponse.Items[0].duplicatedTemplateUids) {
        userDuplicatedUids = Array.from(userResponse.Items[0].duplicatedTemplateUids.values);
    }
    console.log(`Authenticated user ${userId} for delete operation.`);

  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
  // --- End Authentication ---

  const { templateUid } = req.body;
  if (!templateUid) {
    return res.status(400).json({ success: false, message: 'Missing templateUid in request body.' });
  }

  // --- Authorization: Check if user owns this template --- 
  if (!userDuplicatedUids.includes(templateUid)) {
      console.warn(`Authorization failed: User ${userId} attempted to delete template ${templateUid} which they do not own.`);
      return res.status(403).json({ success: false, message: 'Forbidden - You do not own this template.' });
  }
  // --- End Authorization ---

  const apiKey = process.env.BANNERBEAR_API_KEY;
  if (!apiKey) {
    console.error('BANNERBEAR_API_KEY environment variable not set.');
    return res.status(500).json({ success: false, message: 'Server configuration error: API key missing.' });
  }

  // --- Perform Deletion --- 
  // Step 1: Delete from Bannerbear
  const bbResult = await deleteBannerbearTemplate(apiKey, templateUid);
  if (!bbResult.success) {
      // Log error but proceed to DynamoDB cleanup anyway
      console.warn(`Bannerbear deletion failed for ${templateUid}, but proceeding with DynamoDB cleanup. Error: ${bbResult.error}`);
  }

  // Step 2: Remove from DynamoDB
  const dbResult = await removeTemplateFromUser(userId, templateUid);
  if (!dbResult.success) {
      // Return error if DynamoDB update failed, as this is critical for consistency
      return res.status(500).json({ success: false, message: `Template deleted from Bannerbear (or was already gone), but failed to update user record: ${dbResult.error}` });
  }

  console.log(`Successfully processed delete request for template ${templateUid} for user ${userId}.`);
  return res.status(200).json({ success: true, message: 'Template deleted successfully.' });
} 