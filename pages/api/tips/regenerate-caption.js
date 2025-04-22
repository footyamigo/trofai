import AWS from 'aws-sdk';
import { generateTipCaption } from '../../../tip-caption-generator';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Get data needed for regeneration prompt context
  const { advice_heading, advice, currentCaption } = req.body;

  if (!advice_heading || typeof advice_heading !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid advice_heading provided' });
  }
  if (!advice || typeof advice !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid advice provided' });
  }

  // --- Authentication --- 
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
  }

  let userData;
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: SESSION_INDEX,
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      console.log('regenerate-tip-caption API: Invalid session');
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0];
    console.log(`regenerate-tip-caption API: Authenticated user: ${userData.userId}`);
  } catch (authError) {
    console.error('regenerate-tip-caption API - Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }

  try {
    // --- Extract Agent Details ---
    const agentDetails = {
      agent_name: userData.agent_name || userData.name || 'Your Name',
      agent_photo: userData.agent_photo_url || null,
      agent_email: userData.agent_email || userData.email || 'your@email.com',
      agent_number: userData.agent_phone || 'Your Number',
    };
    // --- End Agent Details ---

    // --- Call Caption Generator with Regeneration Flag ---
    console.log("Regenerating tip caption, providing current caption for context...");
    const newCaption = await generateTipCaption(
      advice_heading, 
      advice, 
      agentDetails, 
      true, // isRegeneration = true
      currentCaption
    );

    if (!newCaption) {
      throw new Error('Failed to regenerate caption.');
    }

    // --- Success Response ---
    return res.status(200).json({ success: true, caption: newCaption });

  } catch (error) {
    console.error('[TIPS_REGENERATE_CAPTION_POST] General Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
} 