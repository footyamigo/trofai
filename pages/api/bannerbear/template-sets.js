import Bannerbear from 'bannerbear';
import AWS from 'aws-sdk';

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; 
const SESSION_INDEX = 'SessionIndex'; 

// Helper to extract token (copied from other api routes)
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Initialize Bannerbear client
// Ensure BANNERBEAR_API_KEY is set in your environment variables
const bb = new Bannerbear(process.env.BANNERBEAR_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Authenticate User
  const session = getSessionFromHeader(req);
  let userId = null;
  let userIdPrefix = null;

  if (session) { // Allow unauthenticated access but won't show user sets
    try {
      console.log('Template Sets API: Validating session...');
      const userResponse = await dynamoDb.query({
        TableName: USERS_TABLE,
        IndexName: SESSION_INDEX,
        KeyConditionExpression: '#sess = :session',
        ExpressionAttributeNames: { '#sess': 'session' },
        ExpressionAttributeValues: { ':session': session }
      }).promise();

      if (userResponse.Items && userResponse.Items.length > 0) {
        userId = userResponse.Items[0].userId;
        // Create the prefix exactly as in duplicate-bulk.js
        userIdPrefix = userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'user';
        console.log(`Template Sets API: Authenticated user ${userId}, prefix: ${userIdPrefix}`);
      } else {
         console.log('Template Sets API: Invalid session token.');
      }
    } catch (authError) {
      console.error('Template Sets API - Authentication error:', authError);
      // Don't block the request, just proceed without user context
    }
  }

  if (!process.env.BANNERBEAR_API_KEY) {
    console.error('Bannerbear API Key not configured.');
    return res.status(500).json({ success: false, message: 'Server configuration error: Bannerbear API Key missing.' });
  }

  try {
    console.log('Fetching template sets from Bannerbear...');
    // Fetch template sets - BB API defaults to page 1, limit 25. Adjust if needed.
    const templateSetsResponse = await bb.list_template_sets({ page: 1, limit: 50 }); 
    console.log(`Fetched ${templateSetsResponse.length} template sets.`);

    // Filter Sets
    const filteredSetsResponse = templateSetsResponse.filter(set => {
      // Keep standard sets
      const isStandardSet = /^Template Set \d+$/i.test(set.name);
      if (isStandardSet) {
        return true;
      }
      // Keep sets belonging to the current user (if authenticated)
      if (userIdPrefix && set.name && set.name.startsWith(userIdPrefix + '_')) {
        return true;
      }
      // Filter out other user sets or non-standard sets if not logged in
      return false;
    });
    console.log(`Filtered down to ${filteredSetsResponse.length} sets for user (prefix: ${userIdPrefix || 'none'}).`);

    const formattedSets = filteredSetsResponse.map(set => {
      // Extract preview data for each template within the set
      const previews = set.templates
        ?.map(t => ({
          name: t.name || 'Unnamed Design',
          url: t.preview_url,
          uid: t.uid // Include UID if needed for selection later
        }))
        .filter(t => t.url); // Only include templates that have a preview URL
      
      console.log(`Processing set "${set.name}" (UID: ${set.uid}), found ${previews?.length || 0} previews.`);

      return {
        id: set.uid, 
        name: set.name, 
        description: `Contains ${set.templates?.length || 0} designs.`, 
        // Use the first preview as the main one, or null
        previewUrl: previews && previews.length > 0 ? previews[0].url : null, 
        previews: previews || [], // Include the array of preview objects
        templateUids: set.templates?.map(t => t.uid) || [],
      };
    }).filter(set => set.templateUids.length > 0); // Only include sets that actually contain templates

    console.log(`Returning ${formattedSets.length} non-empty sets.`);

    return res.status(200).json({ success: true, sets: formattedSets });

  } catch (error) {
    console.error('Error fetching or processing Bannerbear template sets:', error);
    const errorMessage = error.message || 'Failed to fetch template sets from Bannerbear.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
} 