import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb'; // Import dynamoDb generic helper too
import tables from '../../../src/aws/dynamoDbSchema'; // Import the schema definition
import fetch from 'node-fetch';

// Load Facebook App Secret from environment variables
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer '
  }
  return null;
};

// Function to verify the access token with Facebook
async function verifyFacebookToken(accessToken, expectedUserId) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('Facebook App ID or Secret not configured on the server.');
    throw new Error('Server configuration error for Facebook integration.');
  }

  // Option 1: Use debug_token (more secure, verifies token belongs to your app)
  // const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;
  // const debugResponse = await fetch(debugUrl);
  // const debugData = await debugResponse.json();
  // 
  // if (!debugResponse.ok || !debugData.data?.is_valid || debugData.data.app_id !== FACEBOOK_APP_ID) {
  //   console.error('Facebook token validation failed (debug_token):', debugData);
  //   throw new Error('Invalid Facebook access token.');
  // }
  // if (debugData.data.user_id !== expectedUserId) {
  //   console.error(`Token user ID (${debugData.data.user_id}) does not match expected user ID (${expectedUserId}).`);
  //   throw new Error('Facebook token user mismatch.');
  // }
  // return debugData.data; // Contains expiry, scopes, etc.

  // Option 2: Call /me endpoint (simpler, verifies token belongs to the user)
  const meUrl = `https://graph.facebook.com/me?access_token=${accessToken}`;
  const meResponse = await fetch(meUrl);
  const meData = await meResponse.json();

  if (!meResponse.ok || !meData.id) {
    console.error('Failed to fetch user data from Facebook:', meData);
    throw new Error('Invalid Facebook access token or failed to fetch user info.');
  }

  if (meData.id !== expectedUserId) {
    console.error(`Token user ID (${meData.id}) does not match expected user ID (${expectedUserId}).`);
    throw new Error('Facebook token user mismatch.');
  }

  console.log('Facebook token verified successfully for user:', meData.id);
  // We might want to get a long-lived token here in a real implementation
  // For now, we'll proceed with the short-lived one provided.
  return { user_id: meData.id }; 
}

// Function to fetch Facebook Pages managed by the user
async function findFacebookPages(fbUserAccessToken) {
    // Request pages managed by the user, getting their ID, name, and a page access token
    const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${fbUserAccessToken}`;
    let managedPages = [];
    
    try {
        console.log('Querying Facebook Graph API for managed pages...');
        const response = await fetch(accountsUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Error fetching FB pages:", data?.error);
            // Handle specific permission errors if needed
            if (data?.error?.code === 200) { // Missing pages_show_list permission
                 throw new Error('Permission to access Facebook Pages was denied or not granted.');
            }
            throw new Error(data?.error?.message || 'Failed to fetch Facebook pages. Ensure permissions are granted.');
        }
        
        if (!data.data || data.data.length === 0) {
            console.log('No Facebook pages found for this user.');
            return managedPages; // Return empty array
        }

        managedPages = data.data.map(page => ({ // Extract relevant info
            fbPageId: page.id,
            fbPageName: page.name,
            fbPageAccessToken: page.access_token // Important: Page Access Token
        }));

        console.log(`Found ${managedPages.length} managed Facebook page(s).`);
        return managedPages;

    } catch (error) {
        console.error("Error in findFacebookPages:", error);
        throw error; 
    }
}

// This API route now FETCHES available pages after login
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) {
            console.log('FB Connect: No session token provided in header');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        console.log('FB Connect: Validating session via DynamoDB...');
        // Use the generic dynamoDb.query and the imported tables schema
        const userResponse = await dynamoDb.query(tables.users.tableName, { 
            IndexName: tables.users.indexes.bySession.indexName, // Use schema for index name
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: {
                '#sess': 'session'
            },
            ExpressionAttributeValues: {
                ':session': session
            }
        });

        if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
            console.log('FB Connect: Invalid session token (no user found)');
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }

        const userData = userResponse.Items[0];
        const userId = userData.userId; // Successfully authenticated and got userId
        console.log(`FB Connect (Fetch Pages): Session valid for user ${userId}`);

        // 2. Get Facebook USER access token from request body (received from FB.login)
        const { accessToken, facebookUserId } = req.body;
        if (!accessToken || !facebookUserId) {
            return res.status(400).json({ success: false, message: 'Facebook User Access Token and User ID are required' });
        }
        
        // NOTE: We don't need to call verifyFacebookToken here anymore, as fetching pages implicitly verifies it.

        // 3. Find Facebook Pages managed by the user
        const availablePages = await findFacebookPages(accessToken);

        // 4. Return the list of found pages (or empty list)
        // We also return the user ID and user access token needed for the final linking step
        return res.status(200).json({ 
            success: true, 
            pages: availablePages,
            facebookUserId: facebookUserId, // Pass back FB User ID
            fbUserAccessToken: accessToken // Pass back the potentially refreshed user token
        });

    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while fetching Facebook pages.',
        });
    }
} 