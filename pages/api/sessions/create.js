import fetch from 'node-fetch';
import AWS from 'aws-sdk';

// Configure AWS & DynamoDB
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';

// Auth Helper
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // --- Authentication --- 
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized - No session provided' });
  }
  let userId;
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: SESSION_INDEX,
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session }
    }).promise();
    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ message: 'Unauthorized - Invalid session' });
    }
    userId = userResponse.Items[0].userId;
    console.log('Create Session API: Authenticated user:', userId);
  } catch (authError) {
    console.error('Create Session API - Authentication error:', authError);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
  // --- End Authentication ---

  const bannerbearApiKey = process.env.BANNERBEAR_API_KEY;
  if (!bannerbearApiKey) {
    console.error('BANNERBEAR_API_KEY environment variable not set.');
    return res.status(500).json({ message: 'Server configuration error: API key missing.' });
  }

  const { templateUid } = req.body;
  if (!templateUid) {
    return res.status(400).json({ message: 'Invalid request: templateUid is required.' });
  }

  // --- Call Bannerbear API --- 
  const bannerbearSessionUrl = 'https://api.bannerbear.com/v2/sessions';
  console.log(`Creating Bannerbear session for template: ${templateUid}`);

  try {
    const bbResponse = await fetch(bannerbearSessionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bannerbearApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template: templateUid }),
    });

    const bbResult = await bbResponse.json();

    if (!bbResponse.ok) {
      console.error(`Bannerbear API Error creating session for ${templateUid}: ${bbResponse.status} ${bbResponse.statusText}`, bbResult);
      throw new Error(bbResult.message || `Bannerbear API Error: ${bbResponse.status}`);
    }

    if (!bbResult.session_editor_url) {
        console.error('Bannerbear response missing session_editor_url:', bbResult);
        throw new Error('Session created but editor URL was missing.');
    }

    console.log(`Successfully created session for ${templateUid}. URL: ${bbResult.session_editor_url}`);
    
    // Return the necessary URL to the frontend
    return res.status(200).json({ 
        success: true, 
        session_editor_url: bbResult.session_editor_url 
    });

  } catch (error) {
    console.error(`Error calling Bannerbear session API for ${templateUid}:`, error);
    return res.status(500).json({ message: 'Failed to create editing session', details: error.message });
  }
} 