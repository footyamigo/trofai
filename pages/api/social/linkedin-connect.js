import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';
import fetch from 'node-fetch';

// Load LinkedIn App Credentials
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
// This should match the redirect URI configured in your LinkedIn Developer App settings
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/social/linkedin-connect` : 'http://localhost:3000/api/social/linkedin-connect'; // Adjust if needed

// Helper to extract token from Authorization header (assuming we might need it later, similar to other connect flows)
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // For OAuth callback, the state parameter often carries the session or user identifier
  // We might need to adjust how we get the user context depending on how the initial OAuth request is made
  // For now, let's assume the session might be passed in state or retrieved differently
  // console.log("Attempting to get session from state (if implemented):", req.query.state);
  return null; // Placeholder - need to determine how user context is passed
};

// Helper to exchange authorization code for access token
async function exchangeCodeForToken(code) {
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
        throw new Error('Server configuration error: LinkedIn credentials missing.');
    }
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
    });

    console.log('Exchanging LinkedIn auth code for token...');
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const data = await response.json();

        if (!response.ok || data.error || !data.access_token) {
            console.error('LinkedIn Token Exchange Error:', data);
            throw new Error(data?.error_description || 'Failed to obtain LinkedIn access token.');
        }
        console.log('LinkedIn Token Exchange Successful.');
        // access_token, expires_in, scope, id_token (if openid scope requested)
        return data; 
    } catch (error) {
        console.error('Error during LinkedIn token exchange:', error);
        throw error;
    }
}

// Helper to get user info (URN/sub) using the access token
async function getLinkedInUserInfo(accessToken) {
    const userInfoUrl = 'https://api.linkedin.com/v2/userinfo'; 
    console.log('Fetching LinkedIn user info...');
    try {
        const response = await fetch(userInfoUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (!response.ok || !data.sub) {
            console.error('LinkedIn UserInfo Error:', data);
            throw new Error('Failed to fetch LinkedIn user info (URN/sub).');
        }
        console.log('LinkedIn UserInfo Fetched:', data);
        // Returns object like: { sub: 'urn:li:person:xxxx', name: '...', given_name: '...', ... }
        return data;
    } catch (error) {
        console.error('Error fetching LinkedIn user info:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') { // LinkedIn callback is GET
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error('LinkedIn OAuth Error Callback:', error, error_description);
        // Redirect user back to settings page with error message
        const redirectUrl = `/dashboard/settings?linkedin_error=${encodeURIComponent(error_description || error)}`;
        return res.redirect(302, redirectUrl);
    }

    if (!code) {
        return res.status(400).json({ success: false, message: 'Authorization code missing.' });
    }

    // --- User Identification & State Validation ---
    if (!state) {
        console.error('LinkedIn OAuth Callback: Missing state parameter.');
        // Redirect with error - state is crucial for linking user and CSRF
        return res.redirect(302, `/dashboard/settings?linkedin_error=${encodeURIComponent('Invalid request state.')}`);
    }

    // Assume 'state' contains the Trofai session token sent from the frontend
    const sessionToken = state;
    let userId = null;

    try {
        console.log('LinkedIn Connect: Validating session via state parameter...');
        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': sessionToken } // Use session token from state
        });

        if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
            console.error(`LinkedIn Connect: Invalid session token received in state: ${sessionToken}`);
            return res.redirect(302, `/dashboard/settings?linkedin_error=${encodeURIComponent('Invalid session or state.')}`);
        }
        
        userId = userResponse.Items[0].userId;
        console.log(`LinkedIn Connect: Identified user ${userId} from session in state.`);

        // TODO: Implement proper CSRF validation here. 
        // Example: Compare `state` (sessionToken) with a value stored *before* redirecting.
        // const storedState = getCsrfTokenForSession(sessionToken); // Hypothetical
        // if (state !== storedState) { throw new Error('State mismatch (CSRF)'); }

    } catch (dbError) {
        console.error('LinkedIn Connect: Error validating session from state:', dbError);
        return res.redirect(302, `/dashboard/settings?linkedin_error=${encodeURIComponent('Session validation failed.')}`);
    }
    
    // --- Token Exchange and Credential Storage ---
    // const simulatedUserId = "user-placeholder-from-state-or-session"; // <<< REMOVE THIS
    // const userId = simulatedUserId; // <<< REMOVE THIS
    
    // console.log(`LinkedIn Connect: Processing callback for user (simulated): ${userId}`); // Remove simulation log

    try {
        // 1. Exchange code for token
        const tokenData = await exchangeCodeForToken(code);
        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in; // In seconds
        // const idToken = tokenData.id_token; // Can parse this for user info too if needed

        // 2. Get LinkedIn User Info (URN/sub is needed for posting)
        const userInfo = await getLinkedInUserInfo(accessToken);
        const linkedinUrn = userInfo.sub; // This is the author URN required for posting
        const linkedinName = userInfo.name; // For display purposes
        const linkedinProfilePic = userInfo.picture; // Optional, for display

        // 3. Calculate expiry timestamp
        const expiryTimestamp = Math.floor(Date.now() / 1000) + expiresIn;

        // 4. Store credentials in DynamoDB for the user
        console.log(`Updating DynamoDB for user ${userId} with LinkedIn credentials...`); // Uses correct userId now
        const params = {
            TableName: tables.users.tableName,
            Key: { userId: userId },
            UpdateExpression: 'SET #liUrn = :liUrn, #liToken = :liToken, #liExpiry = :liExpiry, #liName = :liName, #liPic = :liPic, #liConnectedAt = :liConnectedAt',
            ExpressionAttributeNames: {
                '#liUrn': 'linkedinUrn',
                '#liToken': 'linkedinAccessToken',
                '#liExpiry': 'linkedinTokenExpiry',
                '#liName': 'linkedinName',
                '#liPic': 'linkedinProfilePic',
                '#liConnectedAt': 'linkedinConnectedAt',
            },
            ExpressionAttributeValues: {
                ':liUrn': linkedinUrn,
                ':liToken': accessToken, // Store the access token
                ':liExpiry': expiryTimestamp,
                ':liName': linkedinName,
                ':liPic': linkedinProfilePic,
                ':liConnectedAt': new Date().toISOString(),
            },
            ReturnValues: 'UPDATED_NEW',
        };

        await dynamoDb.update(params.TableName, params.Key, {
            UpdateExpression: params.UpdateExpression,
            ExpressionAttributeNames: params.ExpressionAttributeNames,
            ExpressionAttributeValues: params.ExpressionAttributeValues,
            ReturnValues: params.ReturnValues
        });

        console.log(`Successfully connected LinkedIn for user ${userId}`); // Uses correct userId now

        // 5. Redirect user back to settings page (or wherever appropriate)
        // Indicate success
        const redirectUrl = '/dashboard/settings?linkedin_connected=true';
        return res.redirect(302, redirectUrl);

    } catch (error) {
        console.error(`Error during LinkedIn connection process for user ${userId}:`, error); // Log with correct userId
        // Redirect user back to settings page with a generic error
        const redirectUrl = `/dashboard/settings?linkedin_error=${encodeURIComponent(error.message || 'Connection failed')}`;
        return res.redirect(302, redirectUrl);
    }
} 