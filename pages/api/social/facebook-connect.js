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

// Helper function to exchange token (now used earlier)
async function exchangeForLongLivedUserToken(shortLivedToken) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('Cannot get long-lived token: FB App ID or Secret missing.');
      throw new Error('Server configuration error for Facebook token exchange.');
  }
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
  try {
      console.log('Exchanging FB user token for long-lived token...');
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.error || !data.access_token) {
          console.error('Error exchanging token:', data?.error);
          throw new Error(data?.error?.message || 'Failed to obtain long-lived Facebook token.');
      }
      console.log('Successfully obtained long-lived FB user token.');
      return { longLivedToken: data.access_token, expiresIn: data.expires_in };
  } catch (error) { /* ... error handling ... */ throw error; }
}

// Updated function to fetch ALL Facebook Pages using the long-lived token
async function findFacebookPages(longLivedFbUserToken) { 
    let allPages = [];
    let accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&limit=100&access_token=${longLivedFbUserToken}`;
    try {
        console.log('Querying FB Graph API for managed pages with LLT (handling pagination)...');
        while (accountsUrl) {
            console.log(`Fetching page data from: ${accountsUrl.substring(0, 100)}...`);
            const response = await fetch(accountsUrl);
            const data = await response.json();
            if (!response.ok || data.error) { /* ... error handling ... */ throw new Error(data?.error?.message || 'Failed to fetch Facebook pages batch.'); }
            if (data.data && data.data.length > 0) {
                const pagesInBatch = data.data.map(page => ({ 
                    fbPageId: page.id,
                    fbPageName: page.name,
                    fbPageAccessToken: page.access_token
                }));
                allPages = allPages.concat(pagesInBatch);
            }
            accountsUrl = (data.paging && data.paging.next) ? data.paging.next : null;
        }
        console.log(`Found ${allPages.length} managed Facebook page(s) in total.`);
        return allPages;
    } catch (error) { /* ... error handling ... */ throw error; }
}

// This API route now exchanges the token first, then fetches pages
export default async function handler(req, res) {
    if (req.method !== 'POST') { return res.status(405).json({ success: false, message: 'Method not allowed' }); }
    try {
        // 1. Authenticate Trofai User 
        const session = getSessionFromHeader(req);
        if (!session) { return res.status(401).json({ success: false, message: 'Authentication required' }); }
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
        if (!userResponse || !userResponse.Items || !userResponse.Items.length === 0) { return res.status(401).json({ success: false, message: 'Invalid session' }); }
        const userId = userResponse.Items[0].userId;
        console.log(`FB Connect (Fetch Pages - LLT): Session valid for user ${userId}`);

        // 2. Get SHORT-LIVED FB user token from body
        const { accessToken, facebookUserId } = req.body;
        if (!accessToken || !facebookUserId) { return res.status(400).json({ success: false, message: 'Facebook User Access Token and User ID are required' }); }
        
        // 3. Exchange for LONG-LIVED token immediately
        const { longLivedToken, expiresIn } = await exchangeForLongLivedUserToken(accessToken);

        // 4. Find Facebook Pages using the LONG-LIVED token
        const availablePages = await findFacebookPages(longLivedToken);
        
        // Calculate expiry timestamp for the LLT
        const expiryTimestamp = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;

        // 5. Return list, LLT, expiry, and original user ID
        return res.status(200).json({ 
            success: true, 
            pages: availablePages,
            facebookUserId: facebookUserId,      // Original User ID
            fbUserAccessToken: longLivedToken, // The LONG-LIVED token
            fbTokenExpiry: expiryTimestamp       // Expiry time
        });

    } catch (error) {
        console.error('Error in FB Connect (Fetch Pages - LLT) flow:', error);
        return res.status(500).json({ success: false, message: error.message || 'Error processing Facebook connection.' });
    }
} 