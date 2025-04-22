import AWS from 'aws-sdk';
import { generateTipCaption } from '../../../tip-caption-generator'; // Adjust path if needed

// --- AWS Config and Session Helper (Similar to other endpoints) ---
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
// --- End Helpers ---

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
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
            console.log('generate-caption API: Invalid session');
            return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
        }
        userData = userResponse.Items[0];
        console.log(`generate-caption API: Authenticated user: ${userData.userId}`);
    } catch (authError) {
        console.error('generate-caption API - Authentication error:', authError);
        return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
    }
    // --- End Authentication ---

    try {
        const { advice_heading, advice, currentCaption, isRegeneration } = req.body;

        // --- Input Validation ---
        if (!advice_heading || typeof advice_heading !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid advice_heading provided' });
        }
        if (!advice || typeof advice !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid advice provided' });
        }
        // --- End Validation ---

        // --- Extract Agent Details --- (Required by generateTipCaption)
        const agentDetails = {
            agent_name: userData.agent_name || userData.name || 'Your Name',
            agent_photo: userData.agent_photo_url || null,
            agent_email: userData.agent_email || userData.email || 'your@email.com',
            agent_number: userData.agent_phone || 'Your Number',
        };
        // --- End Agent Details ---

        // --- Call Caption Generator --- 
        // TODO: Pass isRegeneration/currentCaption to generateTipCaption if needed 
        // or modify the prompt directly there based on these inputs.
        const newCaption = await generateTipCaption(
            advice_heading, 
            advice, 
            agentDetails,
            isRegeneration === true, 
            currentCaption
        ); 
        // --- End Call --- 

        if (!newCaption) {
            console.error('Caption generation failed or returned null.');
            throw new Error('Failed to generate a new caption.');
        }

        // --- Success Response ---
        return res.status(200).json({ success: true, caption: newCaption });

    } catch (error) {
        console.error('[TIPS_GENERATE_CAPTION_POST] General Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
} 