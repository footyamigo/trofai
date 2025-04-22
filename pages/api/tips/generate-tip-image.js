// pages/api/tips/generate-tip-image.js
import { getAuth } from '@clerk/nextjs/server';
import fetch from 'node-fetch'; // Or use built-in fetch
import AWS from 'aws-sdk'; // Added AWS SDK import
import { generateTipCaption } from '../../../tip-caption-generator';

// Added AWS Config and Session Helper
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';
const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;

const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// TODO: Import necessary database functions (e.g., Prisma client, user settings fetcher)
// import prisma from '@/lib/prisma'; // Example using Prisma

// Placeholder functions - replace with your actual implementation
// async function getUserAgentDetails(userId) { ... old mock function ... }

// <<< Rename and Update History Saving Function >>>
// TODO: Change DynamoDB attribute name (e.g., generatedTipHistory)
async function saveGeneratedAdviceHistory(userId, historyItem) {
    console.log(`Saving generated advice to history for userId: ${userId}`, historyItem);
    try {
        const params = {
            TableName: USERS_TABLE,
            Key: { userId },
            UpdateExpression: "SET #history = list_append(if_not_exists(#history, :empty_list), :new_item)",
            ExpressionAttributeNames: {
                "#history": "generatedAdviceHistory" // Consistent attribute name
            },
            ExpressionAttributeValues: {
                ":new_item": [historyItem], // Append the structured history object
                ":empty_list": []
            },
            ReturnValues: "UPDATED_NEW"
        };
        await dynamoDb.update(params).promise();
        console.log(`Successfully added generated advice to history for userId: ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error saving generated advice to history for userId ${userId}:`, error);
        return false;
    }
}
// <<< End Rename and Update >>>

// <<< Added Polling Configuration >>>
const POLLING_INTERVAL = 2500; // milliseconds (2.5 seconds)
const MAX_POLLING_ATTEMPTS = 24; // Total polling time ~1 minute (24 * 2.5s)
// --- End Polling Configuration ---

// <<< Added Polling Function (Copied from generate-review-banner) >>>
async function pollBannerbearCollection(uid) {
  let attempts = 0;
  while (attempts < MAX_POLLING_ATTEMPTS) {
    attempts++;
    console.log(`Polling Bannerbear collection ${uid}, attempt ${attempts}/${MAX_POLLING_ATTEMPTS}`);
    try {
      const response = await fetch(`https://api.bannerbear.com/v2/collections/${uid}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
      });

      if (!response.ok) {
        console.error(`Polling error: Bannerbear API returned status ${response.status}`);
        // Don't throw immediately, just wait and retry
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

      // If still pending, wait before next attempt
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

    } catch (error) {
      console.error(`Error during polling attempt ${attempts} for ${uid}:`, error);
      // If a specific attempt fails (e.g., network), wait and retry unless max attempts reached
      if (attempts >= MAX_POLLING_ATTEMPTS) {
          throw new Error(`Polling failed after ${attempts} attempts: ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }
  // If loop finishes without success or specific failure
  throw new Error(`Bannerbear collection generation timed out after ${MAX_POLLING_ATTEMPTS} attempts.`);
}
// --- End Polling Function ---

// --- Main Route Handler (Pages Router Format) ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Implement Session Authentication & Fetch Full User Data
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
             console.log('Invalid session - no matching user found in DynamoDB');
            return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session token' });
        }
        userData = userResponse.Items[0]; // <<< Store full user data
        console.log(`generate-tip-image API: Authenticated user: ${userData.userId}`); // <<< Updated log prefix >>>
    } catch (authError) {
        console.error('generate-tip-image API - Authentication error:', authError);
        return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
    }

    if (!BANNERBEAR_API_KEY) {
        console.error('BANNERBEAR_API_KEY is not configured.');
        return res.status(500).json({ success: false, message: 'Internal Server Error - Image generation configuration missing' });
    }

    try {
        const body = req.body;
        const { tips_type, advice_heading, advice, templatesetId } = body;

        // <<< Update input validation >>>
        if (!tips_type || typeof tips_type !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid tips_type provided' });
        }
        if (!advice_heading || typeof advice_heading !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid advice_heading provided' });
        }
        if (!advice || typeof advice !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid advice provided' });
        }
        if (!templatesetId || typeof templatesetId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid templatesetId provided' });
        }
        // --- End Update --- 

        console.log(`Generating tip COLLECTION for user: ${userData.userId}, templateSet: ${templatesetId}`);

        // 1. Extract Agent Details directly from userData
        const agentDetails = {
            agent_name: userData.agent_name || userData.name || 'Your Name', // Added userData.name fallback
            agent_photo: userData.agent_photo_url || null,
            agent_email: userData.agent_email || userData.email || 'your@email.com', // Added userData.email fallback
            agent_number: userData.agent_phone || 'Your Number',
            real_estate_agent: userData.agent_title || userData.title || 'REAL ESTATE AGENT', // Added userData.title fallback
            brokerage_logo: userData.brokerage_logo_url || null
        };
        console.log("Using agent details:", agentDetails); // Log the details being used

        // 2. Prepare Bannerbear Payload for COLLECTION
        const modifications = [
            { name: "tips_type", text: tips_type }, // Map category to tips_type layer
            { name: "advice_heading", text: `${advice_heading.toUpperCase()}.` }, 
            { name: "advice", text: advice }, // Map advice text
            { name: "agent_name", text: agentDetails.agent_name },
            { name: "agent_email", text: agentDetails.agent_email },
            { name: "agent_number", text: agentDetails.agent_number },
            { name: "real_estate_agent", text: agentDetails.real_estate_agent }, // Keep if template uses it
        ];

        // Conditionally add agent_photo if URL exists
        if (agentDetails.agent_photo) {
            modifications.push({ name: "agent_photo", image_url: agentDetails.agent_photo });
        }

        // Conditionally add brokerage_logo if URL exists (assuming layer name is "logo")
        if (agentDetails.brokerage_logo) {
            modifications.push({ name: "logo", image_url: agentDetails.brokerage_logo });
        }

        // 3. Call Bannerbear COLLECTIONS API
        console.log('Sending request to Bannerbear Collections API...');
        const bbApiUrl = `https://api.bannerbear.com/v2/collections`;

        const response = await fetch(bbApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_set: templatesetId,
                modifications: modifications,
            }),
        });

        const initialCollectionData = await response.json();

        if (!response.ok) {
            console.error(`Bannerbear Collections API Error (${response.status}):`, initialCollectionData);
            const errorMessage = initialCollectionData?.message || `Failed to generate collection (${response.statusText})`;
            throw new Error(errorMessage);
        }

        // <<< Integrate Polling Logic >>>
        let finalCollectionData = null;

        if (initialCollectionData.status === 'completed') {
            console.log("Collection completed immediately.");
            finalCollectionData = initialCollectionData;
        } else if (initialCollectionData.status === 'pending' && initialCollectionData.uid) {
            console.log(`Collection pending (UID: ${initialCollectionData.uid}). Starting polling...`);
            finalCollectionData = await pollBannerbearCollection(initialCollectionData.uid); // Poll for completion
        } else {
            console.error("Collection generation started with unexpected status:", initialCollectionData);
            throw new Error(`Bannerbear generation returned unexpected status: ${initialCollectionData.status || 'unknown'}.`);
        }

        // Check final status after polling (or immediate completion)
        if (!finalCollectionData || finalCollectionData.status !== 'completed') {
             console.error("Failed to get completed Bannerbear response after polling/initial check:", finalCollectionData);
             throw new Error('Failed to retrieve completed Bannerbear generation.');
        }
        // --- End Polling Integration ---

        // Extract image URL from the final completed collection data
        let imageUrl = null;
        if (finalCollectionData.images && finalCollectionData.images.length > 0) {
             const targetImage = finalCollectionData.images.find(img => img.template_name?.includes('design1'));
             imageUrl = targetImage?.image_url_png || finalCollectionData.images[0].image_url_png;
        }

        if (!imageUrl) {
             console.error("Could not extract a suitable image URL from the completed collection:", finalCollectionData);
             throw new Error("Image generation succeeded but the image URL could not be found.");
        }

        console.log(`Bannerbear image extracted: ${imageUrl}`);

        // Generate Caption FIRST so it can be saved in history
        const caption = await generateTipCaption(advice_heading, advice, agentDetails);
        console.log("Generated caption BEFORE saving history:", caption ? caption.substring(0, 70) + "..." : "null"); // More detailed log

        // 4. Save detailed history AFTER successful image generation --- 
        const historyItem = {
            advice_heading: advice_heading,
            advice: advice,
            category: tips_type,
            timestamp: new Date().toISOString(),
            templateSetId: templatesetId,
            imageUrl: finalCollectionData.images?.[0]?.image_url_png || finalCollectionData.images?.[0]?.image_url || null, 
            collectionUid: finalCollectionData.uid, 
            caption: caption || null // Ensure caption is included
        };
        
        // Log the item being saved
        console.log("Saving historyItem to DynamoDB:", JSON.stringify(historyItem, null, 2)); 

        await saveGeneratedAdviceHistory(userData.userId, historyItem);
        // --- End Save detailed history ---

        // 6. Return Results (including Bannerbear data and caption)
        return res.status(200).json({
            success: true,
            message: 'Tip image collection and caption generated successfully',
            bannerbear: finalCollectionData, 
            caption: caption || 'Caption could not be generated.' 
        });

    } catch (error) {
        console.error('[GENERATE_TIP_IMAGE_POST]', error); 
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
} 