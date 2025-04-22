import AWS from 'aws-sdk';
// Import the new generator function (we'll create this next)
import { generateQuoteCaption } from '../../../quote-caption-generator';

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; // Assuming same table name
const SESSION_INDEX = 'SessionIndex'; // Assuming same index name

// Helper function to get session token
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Get quote and author from request body
  const { quote, author } = req.body;

  if (!quote || !author) {
    return res.status(400).json({ success: false, message: 'Missing quote or author in request body.' });
  }

  let agentProfile = null;
  const session = getSessionFromHeader(req);

  // --- Fetch Agent Profile ---
  if (session) {
    try {
      const userResponse = await dynamoDb.query({
        TableName: USERS_TABLE,
        IndexName: SESSION_INDEX,
        KeyConditionExpression: '#sess = :session',
        ExpressionAttributeNames: { '#sess': 'session' },
        ExpressionAttributeValues: { ':session': session }
      }).promise();

      if (userResponse.Items && userResponse.Items.length > 0) {
        const userData = userResponse.Items[0];
        console.log("Agent profile found for quote caption generation:", userData.userId);
        // Extract needed details for the caption generator function
        agentProfile = {
          name: userData.agent_name || userData.name || '', // Use agent name or fallback to user name
          email: userData.agent_email || userData.email || '', // Use agent email or fallback to user email
          phone: userData.agent_phone || '' // Use agent phone number
          // Add other fields if needed by the quote caption prompt (e.g., title, brokerage)
          // title: userData.agent_title || userData.title || '',
          // brokerage: userData.brokerage_name || '', 
        };
      } else {
        console.warn("No user found for the provided session token (quote caption).");
      }
    } catch (dbError) {
      console.warn("Could not fetch agent profile for quote caption generation:", dbError);
      // Proceed without agent profile, defaults will be used in the generator
    }
  } else {
    console.warn("No session token provided, cannot fetch agent profile (quote caption).");
  }
  // --- End Agent Profile Fetch ---

  try {
    // Pass quote, author, and agentProfile to the generator
    const caption = await generateQuoteCaption(quote, author, agentProfile);

    if (!caption) {
      throw new Error('Failed to generate caption.');
    }

    return res.status(200).json({ success: true, caption: caption });

  } catch (error) {
    console.error("Error in /api/quotes/generate-caption:", error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error generating quote caption' });
  }
} 