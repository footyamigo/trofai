import fetch from 'node-fetch';
import getConfig from 'next/config';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';

// Get server config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;

// Path to the configuration file
const ALLOWED_IDS_PATH = path.resolve(process.cwd(), 'config/listingTemplateSetIds.json');

// Helper function to format template names
const formatTemplateName = (templateName) => {
  if (!templateName) return 'Design';
  return templateName
    .replace(/^template_/, '')
    .replace(/_image_url$/, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ').trim();
};

// Helper to fetch a single template set
async function fetchSingleTemplateSet(uid) {
    if (!BANNERBEAR_API_KEY) {
        console.error("Bannerbear API Key is not configured.");
        return null;
    }
    console.log(`Fetching specific template set: ${uid}`);
    try {
        const response = await fetch(`https://api.bannerbear.com/v2/template_sets/${uid}?extended=true`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to fetch template set ${uid}. Status: ${response.status}, Body: ${errorBody}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching template set ${uid}:`, error);
        return null;
    }
}

// Helper to extract token
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // Read Allowed IDs from File
    let allowedTemplateSetIds = [];
    try {
        if (fs.existsSync(ALLOWED_IDS_PATH)) {
            const fileContent = fs.readFileSync(ALLOWED_IDS_PATH, 'utf-8');
            allowedTemplateSetIds = JSON.parse(fileContent);
            if (!Array.isArray(allowedTemplateSetIds)) {
                throw new Error('Config file content is not a JSON array.');
            }
            console.log(`Loaded ${allowedTemplateSetIds.length} allowed listing template set IDs from config.`);
        } else {
            console.warn(`Configuration file not found at ${ALLOWED_IDS_PATH}. No template sets will be loaded.`);
            return res.status(200).json({ success: true, sets: [] });
        }
    } catch (error) {
        console.error(`Error reading or parsing ${ALLOWED_IDS_PATH}:`, error);
        return res.status(500).json({ success: false, message: 'Error reading template set configuration.' });
    }

    // --- Fetch user-owned template set IDs (duplicated sets) ---
    let userOwnedSetIds = [];
    let session = getSessionFromHeader(req);
    if (session) {
      try {
        AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
        const dynamoDb = new AWS.DynamoDB.DocumentClient();
        const USERS_TABLE = 'trofai-users';
        const SESSION_INDEX = 'SessionIndex';
        const userResponse = await dynamoDb.query({
          TableName: USERS_TABLE,
          IndexName: SESSION_INDEX,
          KeyConditionExpression: '#sess = :session',
          ExpressionAttributeNames: { '#sess': 'session' },
          ExpressionAttributeValues: { ':session': session }
        }).promise();
        if (userResponse.Items && userResponse.Items.length > 0) {
          const userObj = userResponse.Items[0];
          console.log('Full user object from DynamoDB:', JSON.stringify(userObj, null, 2));
          userOwnedSetIds = [
            ...(userObj.userDuplicatedListingTemplateSetIds?.values || [])
          ];
        }
        console.log(`User-owned (duplicated) template set IDs:`, userOwnedSetIds);
      } catch (err) {
        console.error('Error fetching user-owned template set IDs:', err);
      }
    }

    // Merge user-owned IDs (first), then config IDs, dedupe
    const mergedSetIds = [...new Set([...(userOwnedSetIds || []), ...allowedTemplateSetIds])];

    if (mergedSetIds.length === 0) {
        console.log("No allowed template set IDs configured. Returning empty list.");
        return res.status(200).json({ success: true, sets: [] });
    }

    try {
        console.log(`Fetching details for ${mergedSetIds.length} specified template set(s)...`);
        const results = await Promise.allSettled(
            mergedSetIds.map(uid => fetchSingleTemplateSet(uid))
        );
        const fetchedTemplateSets = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map((result, idx) => {
              const set = result.value;
              const isUserOwned = userOwnedSetIds.includes(set.uid);
              return { set, isUserOwned, idx };
            });
        console.log(`Successfully fetched details for ${fetchedTemplateSets.length} template set(s).`);

        // --- START RENAME LOGIC --- 
        let platformSetCounter = 1;
        let userSetCounter = 1;
        
        // Sort user-owned sets to the front
        fetchedTemplateSets.sort((a, b) => {
            if (a.isUserOwned && !b.isUserOwned) return -1;
            if (!a.isUserOwned && b.isUserOwned) return 1;
            return 0;
        });

        // Map the fetched sets to the format expected by TemplateSelector
        const formattedSets = fetchedTemplateSets.map(({ set, isUserOwned }) => {
             const previews = set.templates
                ?.map(t => ({
                    name: formatTemplateName(t.name), 
                    url: t.preview_url, 
                    uid: t.uid 
                }))
                .filter(t => t.url); 
            
            let displayName;
            if (isUserOwned) {
                displayName = `My Template Set ${userSetCounter++}`;
            } else {
                displayName = `Template Set ${platformSetCounter++}`;
            }

            return {
                id: set.uid, 
                name: set.name, 
                display_name: displayName,
                description: `Contains ${set.templates?.length || 0} designs.`, 
                previewUrl: previews && previews.length > 0 ? previews[0].url : null, 
                previews: previews || [], 
                templateUids: set.templates?.map(t => t.uid) || [], 
                isUserOwned,
            };
        }).filter(set => set.templateUids.length > 0); 
        // --- END RENAME LOGIC --- 

        console.log(`Returning ${formattedSets.length} non-empty formatted listing sets.`);
        return res.status(200).json({ success: true, sets: formattedSets });
    } catch (error) {
        console.error("Error processing specified template sets:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error processing template sets.' });
    }
} 