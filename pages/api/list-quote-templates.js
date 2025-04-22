import fetch from 'node-fetch'; // Or use built-in fetch if available
import getConfig from 'next/config';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk'; // <<< Added AWS

// <<< Added AWS Config and Session Helper >>>
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; // Assuming same table name
const SESSION_INDEX = 'SessionIndex'; // Assuming same index name

const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};
// <<< End Added AWS Config and Session Helper >>>

// Get server config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;

// Path to the QUOTE configuration file
const ALLOWED_IDS_PATH = path.resolve(process.cwd(), 'config/quoteTemplateSetIds.json'); // <<< Use quote config file

// Helper function to format template names (reused from testimonial api)
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

// Helper to fetch a SINGLE template set (reused from testimonial api)
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

// <<< Added Helper to fetch user's owned templates >>>
async function getUserOwnedTemplates(userId) {
    console.log(`Fetching owned templates for userId: ${userId}`);
    try {
        const params = {
            TableName: USERS_TABLE,
            Key: { userId },
            ProjectionExpression: "ownedTemplateSets" // <<< Fetch the specific field
        };
        const data = await dynamoDb.get(params).promise();
        // Return the list (or empty list if not found/no field)
        return data.Item?.ownedTemplateSets || [];
    } catch (error) {
        console.error(`Error fetching owned templates for userId ${userId}:`, error);
        return []; // Return empty list on error
    }
}
// <<< End Added Helper >>>

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // <<< Implement Session Authentication >>>
    const session = getSessionFromHeader(req);
    if (!session) {
        // Allow unauthenticated access but log it, owned templates will be empty
        console.warn('list-quote-templates: No session token provided. Proceeding without user context.');
        // return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
    }

    let userId = null; // Initialize userId as null
    let userOwnedTemplateSetIds = []; // Initialize as empty

    if (session) { // Only try to fetch user data if session exists
        try {
            const userResponse = await dynamoDb.query({
                TableName: USERS_TABLE,
                IndexName: SESSION_INDEX,
                KeyConditionExpression: '#sess = :session',
                ExpressionAttributeNames: { '#sess': 'session' },
                ExpressionAttributeValues: { ':session': session }
            }).promise();

            if (userResponse.Items && userResponse.Items.length > 0) {
                userId = userResponse.Items[0].userId;
                console.log(`list-quote-templates API: Authenticated user: ${userId}`);
                // Fetch owned templates for the authenticated user
                userOwnedTemplateSetIds = await getUserOwnedTemplates(userId);
                console.log(`User ${userId} owns ${userOwnedTemplateSetIds.length} template sets.`);
            } else {
                 console.warn('list-quote-templates API: Invalid session - no matching user found. Proceeding without user context.');
            }
        } catch (authError) {
            console.error('list-quote-templates API - Authentication error:', authError);
            // Proceed without user context in case of auth error
             console.warn('Proceeding without user context due to authentication error.');
        }
    }
    // --- End Authentication ---

    // Read Allowed IDs from QUOTE File
    let allowedTemplateSetIds = [];
    try {
        if (fs.existsSync(ALLOWED_IDS_PATH)) {
            const fileContent = fs.readFileSync(ALLOWED_IDS_PATH, 'utf-8');
            allowedTemplateSetIds = JSON.parse(fileContent);
            if (!Array.isArray(allowedTemplateSetIds)) {
                throw new Error('Quote config file content is not a JSON array.');
            }
            console.log(`Loaded ${allowedTemplateSetIds.length} allowed QUOTE template set IDs from config.`); // <<< Log message updated
        } else {
            console.warn(`Quote configuration file not found at ${ALLOWED_IDS_PATH}. No template sets will be loaded.`);
             return res.status(200).json({ success: true, sets: [] });
        }
    } catch (error) {
        console.error(`Error reading or parsing ${ALLOWED_IDS_PATH}:`, error);
        return res.status(500).json({ success: false, message: 'Error reading quote template set configuration.' }); // <<< Error message updated
    }

    // Exit early if no IDs are configured
    if (allowedTemplateSetIds.length === 0) {
        console.log("No allowed quote template set IDs configured. Returning empty list."); // <<< Log message updated
        return res.status(200).json({ success: true, sets: [] });
    }

    // Fetch ONLY the specified template sets
    try {
        console.log(`Fetching details for ${allowedTemplateSetIds.length} specified QUOTE template set(s)...`); // <<< Log message updated

        const results = await Promise.allSettled(
            allowedTemplateSetIds.map(uid => fetchSingleTemplateSet(uid))
        );

        const fetchedTemplateSets = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);

        console.log(`Successfully fetched details for ${fetchedTemplateSets.length} QUOTE template set(s).`); // <<< Log message updated

        // Map the fetched sets to the format expected by TemplateSelector
        const formattedSets = fetchedTemplateSets.map(set => {
             const previews = set.templates
                ?.map(t => ({
                    name: formatTemplateName(t.name),
                    url: t.preview_url,
                    uid: t.uid
                }))
                .filter(t => t.url);

            // Check if the template set has at least one template with a preview
            if (!previews || previews.length === 0) {
                 console.warn(`Template set ${set.uid} (${set.name}) has no templates with preview URLs. Skipping.`);
                 return null; // Skip this template set if it has no valid previews
            }

            // <<< Add isUserOwned flag >>>
            const isUserOwned = userOwnedTemplateSetIds.includes(set.uid);

            return {
                id: set.uid, // ID used for selection in the frontend
                name: set.name, // Internal name
                display_name: formatTemplateName(set.name), // User-facing name <<< Use formatted name
                description: `Contains ${set.templates?.length || 0} design(s).`, // <<< Adjusted description text
                previewUrl: previews[0].url, // Use the first template's preview as the main one
                previews: previews || [], // Array of all template previews
                templateUids: set.templates?.map(t => t.uid) || [], // Array of actual template UIDs in the set
                isUserOwned: isUserOwned // <<< Added the flag
            };
        }).filter(set => set !== null && set.templateUids.length > 0); // Filter out nulls and sets with no templates

        console.log(`Returning ${formattedSets.length} non-empty formatted QUOTE sets.`); // <<< Log message updated

        return res.status(200).json({ success: true, sets: formattedSets });

    } catch (error) {
        console.error("Error processing specified QUOTE template sets:", error); // <<< Error message updated
        return res.status(500).json({ success: false, message: error.message || 'Internal server error processing quote template sets.' }); // <<< Error message updated
    }
} 