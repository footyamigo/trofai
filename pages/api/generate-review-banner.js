import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import getConfig from 'next/config';

// Get server config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';

// --- Added Polling Configuration --- 
const POLLING_INTERVAL = 2500; // milliseconds (2.5 seconds)
const MAX_POLLING_ATTEMPTS = 24; // Total polling time ~1 minute (24 * 2.5s)
// --- End Polling Configuration --- 

// --- Updated Polling Function for Collections --- 
async function pollBannerbearCollection(uid) {
  let attempts = 0;
  while (attempts < MAX_POLLING_ATTEMPTS) {
    attempts++;
    console.log(`Polling Bannerbear collection ${uid}, attempt ${attempts}/${MAX_POLLING_ATTEMPTS}`);
    try {
      // Use the collections endpoint for polling
      const response = await fetch(`https://api.bannerbear.com/v2/collections/${uid}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
      });

      if (!response.ok) {
        console.error(`Polling error: Bannerbear API returned status ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        continue; 
      }

      const data = await response.json();

      if (data.status === 'completed') {
        console.log(`Polling success: Collection ${uid} completed.`);
        return data; // Return the full data object
      }

      if (data.status === 'failed') {
        console.error(`Polling error: Collection ${uid} generation failed.`);
        throw new Error('Bannerbear collection generation failed.');
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

    } catch (error) {
      console.error(`Error during polling attempt ${attempts} for ${uid}:`, error);
      if (attempts >= MAX_POLLING_ATTEMPTS) {
          throw new Error(`Polling failed after ${attempts} attempts: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL)); 
    }
  }
  throw new Error(`Bannerbear collection generation timed out after ${MAX_POLLING_ATTEMPTS} attempts.`);
}
// --- End Polling Function --- 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // 1. Authentication & Fetch User Data
  const session = req.headers.authorization?.replace('Bearer ', '');
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session provided' });
  }

  let userData;
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: 'SessionIndex',
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: {
        '#sess': 'session'
      },
      ExpressionAttributeValues: {
        ':session': session
      }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0];
  } catch (dbError) {
    console.error("DynamoDB user fetch error:", dbError);
    return res.status(500).json({ success: false, message: 'Error fetching user data.' });
  }

  // 2. Extract Agent Profile
  const agentProfile = {
    agent_name: userData.agent_name || userData.name || 'Agent Name', // Fallback
    agent_email: userData.agent_email || userData.email || 'agent@example.com', // Fallback
    agent_number: userData.agent_phone || '01234 567890', // Fallback
    agent_photo: userData.agent_photo_url || null, // Use null if not set
  };

  // 3. Get Review Data AND Template Set ID from Request Body
  const { reviewerName, reviewText, templateSetId } = req.body; // Added templateSetId
  if (!reviewText) {
    return res.status(400).json({ success: false, message: 'Missing reviewText in request body.' });
  }
  if (!templateSetId) { // Added check for templateSetId
    return res.status(400).json({ success: false, message: 'Missing templateSetId in request body.' });
  }

  // 4. Prepare Bannerbear Payload
  const modifications = [
    { name: "review", text: reviewText },
    { name: "reviewer", text: reviewerName || 'Anonymous' }, // Default if null
    { name: "agent_name", text: agentProfile.agent_name },
    { name: "agent_email", text: agentProfile.agent_email },
    { name: "agent_number", text: agentProfile.agent_number },
    // Add agent photo only if URL exists
    ...(agentProfile.agent_photo ? [{ name: "agent_photo", image_url: agentProfile.agent_photo }] : []),
    // Hardcode star rating for now - adjust if needed
    { name: "star_rating", text: "★★★★★" }, 
  ];

  // 5. Call Bannerbear Collections API & Handle Polling
  try {
    console.log("Sending initial request to Bannerbear Collections with template set:", templateSetId);
    
    // Use the /collections endpoint
    const bbResponse = await fetch(`https://api.bannerbear.com/v2/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_set: templateSetId, // Use template_set instead of template
        modifications: modifications,
        transparent: false,
        metadata: { userId: userData.userId, type: 'review_testimonial_collection' } 
      })
    });

    if (!bbResponse.ok) {
      const errorBody = await bbResponse.text();
      console.error(`Bannerbear API Initial POST Error (${bbResponse.status}):`, errorBody);
      throw new Error(`Bannerbear initial request failed with status ${bbResponse.status}. Check logs.`);
    }

    const initialResult = await bbResponse.json();
    console.log("Bannerbear initial collection response received:", initialResult);

    let finalBannerbearResponse = null; // Variable to hold the final object

    if (initialResult.status === 'completed') {
        finalBannerbearResponse = initialResult; // Assign initial result if already complete
    } else if (initialResult.status === 'pending' && initialResult.uid) {
        console.log(`Bannerbear collection status is pending. Starting polling for UID: ${initialResult.uid}`);
        finalBannerbearResponse = await pollBannerbearCollection(initialResult.uid); // Assign polled result
    } else {
        console.error("Bannerbear initial collection response was not pending or completed:", initialResult);
        throw new Error(`Bannerbear collection generation returned unexpected status: ${initialResult.status || 'unknown'}.`);
    }

    // Check if polling returned null or if the final status is not 'completed'
    if (!finalBannerbearResponse || finalBannerbearResponse.status !== 'completed') {
         console.error("Failed to get completed Bannerbear response after polling/initial check:", finalBannerbearResponse);
         throw new Error('Failed to retrieve completed Bannerbear generation.');
    }

    // --- REMOVED History Saving Logic --- 
    // History saving will now be handled on the frontend after caption generation.
    // --- END REMOVED History Saving Logic --- 

    // Return the full Bannerbear response object
    console.log("Returning final Bannerbear response object:", finalBannerbearResponse);
    return res.status(200).json({ success: true, bannerbearResponse: finalBannerbearResponse });

  } catch (error) {
    console.error("Error during Bannerbear collection generation/polling:", error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate Bannerbear image.' });
  }
} 