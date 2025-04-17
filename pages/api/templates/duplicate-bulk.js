import fetch from 'node-fetch';
// Import AWS SDK and initialize DynamoDB client (assuming similar setup to other files)
import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  // Credentials should be configured via environment variables or IAM role
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; // Define table name
const SESSION_INDEX = 'SessionIndex'; // Define index name
const DUPLICATED_TAG = "app-duplicated"; // Define tag constant

// Helper to extract token (copied from other api routes)
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Helper function to duplicate a template AND then rename AND tag it
async function duplicateAndUpdateTemplate(apiKey, sourceUid, originalName, userIdPrefix) {
  const duplicateUrl = `https://api.bannerbear.com/v2/templates?source=${sourceUid}`;
  let newTemplateUid = null;
  let duplicateResponseBody = null;

  // --- Step 1: Duplicate --- 
  console.log(`Step 1: Attempting to duplicate ${sourceUid} (${originalName})`);
  try {
    const duplicateResponse = await fetch(duplicateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    duplicateResponseBody = await duplicateResponse.json();
    if (!duplicateResponse.ok) {
      console.error(`Bannerbear API Error duplicating ${sourceUid}: ${duplicateResponse.status} ${duplicateResponse.statusText}`, duplicateResponseBody);
      return { sourceUid, success: false, error: `Duplication failed: ${duplicateResponseBody.message || `HTTP ${duplicateResponse.status}`}` };
    }
    newTemplateUid = duplicateResponseBody.uid;
    console.log(`Step 1 Success: Duplicated ${sourceUid}. New UID: ${newTemplateUid}`);
  } catch (error) {
    console.error(`Network/other error during duplication step for ${sourceUid}:`, error);
    return { sourceUid, success: false, error: `Duplication failed: ${error.message || 'Unknown error'}` };
  }

  // --- Step 2: Rename AND Tag the new template --- 
  const newName = `${userIdPrefix}_${originalName}`.substring(0, 100); // Limit name length if needed
  console.log(`Step 2: Attempting to rename ${newTemplateUid} to '${newName}' AND tag with '${DUPLICATED_TAG}'`);
  const updateUrl = `https://api.bannerbear.com/v2/templates/${newTemplateUid}`;
  try {
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName, tags: [DUPLICATED_TAG] }), // Update both name and tags
    });
    const updateResponseBody = await updateResponse.json();
    if (!updateResponse.ok) {
      console.error(`Bannerbear API Error updating (rename/tag) ${newTemplateUid}: ${updateResponse.status} ${updateResponse.statusText}`, updateResponseBody);
      return { 
        sourceUid, 
        success: false, 
        error: `Update (rename/tag) failed: ${updateResponseBody.message || `HTTP ${updateResponse.status}`}`, 
        duplicatedTemplate: duplicateResponseBody 
      };
    }
    console.log(`Step 2 Success: Updated ${newTemplateUid}. Final Template:`, updateResponseBody);
    return { sourceUid, success: true, newTemplate: updateResponseBody }; // Return final updated template
  } catch (error) {
    console.error(`Network/other error during update (rename/tag) step for ${newTemplateUid}:`, error);
    return { 
      sourceUid, 
      success: false, 
      error: `Update (rename/tag) failed: ${error.message || 'Unknown error'}`, 
      duplicatedTemplate: duplicateResponseBody 
    };
  }
}

// Helper function to update DynamoDB user item
async function addTemplatesToUser(userId, templateUids) {
  if (!userId || !Array.isArray(templateUids) || templateUids.length === 0) {
    console.error('Invalid input for addTemplatesToUser');
    return false;
  }
  console.log(`Updating DynamoDB for user ${userId} with ${templateUids.length} new template UIDs`);
  
  // Create a Set for DynamoDB update
  const templateUidSet = dynamoDb.createSet(templateUids);

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId,
    },
    UpdateExpression: 'ADD duplicatedTemplateUids :uids SET updatedAt = :now',
    ExpressionAttributeValues: {
      ':uids': templateUidSet,
      ':now': new Date().toISOString(),
    },
    ReturnValues: 'UPDATED_NEW',
  };

  try {
    await dynamoDb.update(params).promise();
    console.log(`Successfully updated DynamoDB for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error updating DynamoDB for user ${userId}:`, error);
    return false;
  }
}

// Helper function to create a Bannerbear Template Set
async function createBannerbearTemplateSet(apiKey, setName, templateUids) {
  const url = 'https://api.bannerbear.com/v2/template_sets';
  console.log(`Creating Bannerbear Template Set: ${setName} with ${templateUids.length} templates`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: setName, templates: templateUids }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error(`Bannerbear API Error creating template set ${setName}: ${response.status} ${response.statusText}`, responseBody);
      return { success: false, error: responseBody.message || `HTTP ${response.status}` };
    }

    console.log(`Successfully created template set ${setName}, UID: ${responseBody.uid}`);
    return { success: true, templateSet: responseBody };

  } catch (error) {
    console.error(`Network/other error creating template set ${setName}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
    console.log('Authenticated user:', userId);
  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
  // --- End Authentication ---

  const apiKey = process.env.BANNERBEAR_API_KEY;
  if (!apiKey) {
    console.error('BANNERBEAR_API_KEY environment variable not set.');
    return res.status(500).json({ message: 'Server configuration error: API key missing.' });
  }

  // Expect array of { uid, name }
  const { templatesToDuplicate } = req.body;
  if (!Array.isArray(templatesToDuplicate) || templatesToDuplicate.length === 0) {
    return res.status(400).json({ message: 'Invalid request: templatesToDuplicate must be a non-empty array of {uid, name}.' });
  }

  // Use a safe version of the userId for the prefix (e.g., remove special chars)
  const userIdPrefix = userId.replace(/[^a-zA-Z0-9_-]/g, '') || 'user'; 

  console.log(`Received request to duplicate, rename & tag ${templatesToDuplicate.length} templates for user ${userId} (prefix: ${userIdPrefix}).`);

  const results = [];
  const successfullyUpdatedUids = []; // Store UIDs of successfully duplicated AND renamed templates
  let firstOriginalName = null; // To store the name for the set

  for (const template of templatesToDuplicate) {
    if (!template.uid || !template.name) { 
        console.warn('Skipping invalid template data in request:', template);
        results.push({ sourceUid: template.uid || 'unknown', success: false, error: 'Missing uid or name' });
        continue; 
    }
    // Call the updated helper
    const result = await duplicateAndUpdateTemplate(apiKey, template.uid, template.name, userIdPrefix);
    results.push(result);
    
    // If both duplication AND rename succeeded, store the new UID for DB update
    if (result.success && result.newTemplate?.uid) {
        successfullyUpdatedUids.push(result.newTemplate.uid);
        if (!firstOriginalName) {
            firstOriginalName = template.name; // Capture the first original name
        }
    }
    
    // Optional delay (slightly longer for 2 API calls)
    await new Promise(resolve => setTimeout(resolve, 200)); 
  }
  
  let templateSetResult = null;
  // --- Step 3: Create Template Set --- 
  if (successfullyUpdatedUids.length > 0 && firstOriginalName) {
    // Infer base name (e.g., "Template50" from "Template50_design1")
    const baseNameMatch = firstOriginalName.match(/^([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*)(?:_design|_story)?\d*$/);
    const baseName = baseNameMatch ? baseNameMatch[1] : firstOriginalName.split('_')[0]; // Fallback logic
    const newSetName = `${userIdPrefix}_${baseName}_Set`;

    templateSetResult = await createBannerbearTemplateSet(apiKey, newSetName, successfullyUpdatedUids);
    // Log result, but don't block response based on this yet
    console.log('Template Set Creation Result:', templateSetResult);
  }

  // --- Step 4: Update DynamoDB --- 
  if (successfullyUpdatedUids.length > 0) {
      addTemplatesToUser(userId, successfullyUpdatedUids)
        .then(success => {
            if (!success) console.error(`Failed to update DB for user ${userId} after duplication/update.`);
        });
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  console.log(`Bulk duplication/update complete: ${successCount} succeeded, ${failureCount} failed.`);

  let responseMessage = `Processed ${results.length} templates. ${successCount} succeeded, ${failureCount} failed. DB update initiated.`;
  if (templateSetResult) {
      responseMessage += templateSetResult.success ? ` Template Set created.` : ` Template Set creation failed.`;
  }

  return res.status(200).json({ 
    message: responseMessage, 
    results,
    templateSetResult // Optionally include detailed set result
  });
} 