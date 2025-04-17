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

// Helper to fetch a SINGLE template from Bannerbear by UID
async function fetchSingleBannerbearTemplate(apiKey, uid) {
  const url = `https://api.bannerbear.com/v2/templates/${uid}`;
  console.log(`Fetching single template: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      // Log specific error for this template but don't fail the whole request
      console.error(`Bannerbear API Error fetching template ${uid}: ${response.status}`);
      return null; // Indicate failure for this specific template
    }
    return await response.json();
  } catch (error) {
    console.error(`Network/other error fetching template ${uid}:`, error);
    return null; // Indicate failure
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- Authentication --- 
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized - No session provided' });
  }

  let userId;
  let userDuplicatedUids = []; // Use Array here
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
    // Get the Set from DynamoDB, convert to Array for iteration
    if (userResponse.Items[0].duplicatedTemplateUids) {
        userDuplicatedUids = Array.from(userResponse.Items[0].duplicatedTemplateUids.values);
    }
    console.log(`Authenticated user ${userId}, found ${userDuplicatedUids.length} duplicated template UIDs in DB.`);

  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
  // --- End Authentication ---

  if (userDuplicatedUids.length === 0) {
      // No duplicated templates for this user, return empty array
      // Set hasMore to false since there's nothing else to load
      return res.status(200).json({ templates: [], hasMore: false }); 
  }

  const apiKey = process.env.BANNERBEAR_API_KEY;
  if (!apiKey) {
    console.error('BANNERBEAR_API_KEY environment variable not set.');
    return res.status(500).json({ message: 'Server configuration error: API key missing.' });
  }

  try {
    // Fetch each template individually using Promise.all for concurrency
    console.log(`Fetching ${userDuplicatedUids.length} specific templates from Bannerbear...`);
    const templatePromises = userDuplicatedUids.map(uid => 
        fetchSingleBannerbearTemplate(apiKey, uid)
    );
    const userTemplatesData = await Promise.all(templatePromises);

    // Filter out any null results (due to fetch errors)
    const userTemplates = userTemplatesData.filter(template => template !== null);
    
    const fetchedCount = userTemplates.length;
    const failedCount = userDuplicatedUids.length - fetchedCount;
    console.log(`Successfully fetched ${fetchedCount} templates, failed to fetch ${failedCount}.`);

    // Return the array of successfully fetched templates
    // hasMore is false because we attempted to fetch all relevant templates
    return res.status(200).json({ 
        templates: userTemplates, 
        hasMore: false 
    });

  } catch (error) {
    console.error(`Error during Promise.all fetching templates for user ${userId}:`, error);
    return res.status(500).json({ message: 'Internal Server Error while fetching user templates', details: error.message });
  }
} 