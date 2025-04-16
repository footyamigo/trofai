import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';
import fetch from 'node-fetch';

// Load FB App Credentials
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Helper function to exchange token (same as in facebook-connect)
async function exchangeForLongLivedUserToken(shortLivedToken) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) { throw new Error('Server configuration error for Facebook token exchange.'); }
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
  try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.error || !data.access_token) { throw new Error(data?.error?.message || 'Failed to obtain long-lived Facebook token.'); }
      return { longLivedToken: data.access_token, expiresIn: data.expires_in };
  } catch (error) { throw error; }
}

// Updated function to fetch ALL Instagram Accounts using the long-lived token
async function findInstagramAccounts(longLivedFbUserToken) { 
    let allIgAccounts = [];
    let accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${longLivedFbUserToken}`;
    try {
        console.log('Querying FB Graph API for pages and linked IG accounts with LLT (handling pagination)...');
        while (accountsUrl) {
            console.log(`Fetching IG account data from: ${accountsUrl.substring(0, 100)}...`);
            const response = await fetch(accountsUrl);
            const data = await response.json();
            if (!response.ok || data.error) {
                console.error("Error fetching FB pages/IG accounts batch:", data?.error);
                if (data?.error?.code === 200) { throw new Error('Permission denied fetching Pages/IG Accounts.'); }
                throw new Error(data?.error?.message || 'Failed to fetch FB pages/IG accounts batch.');
            }
            if (data.data && data.data.length > 0) {
                for (const page of data.data) {
                    if (page.instagram_business_account) {
                        console.log(` Found linked Instagram account: ${page.instagram_business_account.username} on page ${page.name}`);
                        allIgAccounts.push({
                            igUserId: page.instagram_business_account.id,
                            igUsername: page.instagram_business_account.username,
                            igProfilePictureUrl: page.instagram_business_account.profile_picture_url, 
                            fbPageId: page.id,
                            fbPageName: page.name,
                        });
                    }
                }
            }
            accountsUrl = (data.paging && data.paging.next) ? data.paging.next : null;
        }
        console.log(`Found ${allIgAccounts.length} linked Instagram account(s) in total.`);
        return allIgAccounts;
    } catch (error) {
        console.error("Error in findInstagramAccounts (pagination loop):", error);
        throw error; 
    }
}

// This API route now exchanges the token first, then fetches IG accounts
export default async function handler(req, res) {
    if (req.method !== 'POST') { return res.status(405).json({ success: false, message: 'Method not allowed' }); }
    try {
        // 1. Authenticate Trofai User
        const session = getSessionFromHeader(req);
        if (!session) {
           console.log('IG Connect (Fetch - LLT): Auth required');
           return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        console.log('IG Connect (Fetch - LLT): Validating session via DynamoDB...');
        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
        if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
           console.log('IG Connect (Fetch - LLT): Invalid session');
           return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        const userId = userResponse.Items[0].userId;
        console.log(`IG Connect (Fetch - LLT): Session valid for user ${userId}`);

        // 2. Get SHORT-LIVED FB user token from body
        const { fbAccessToken } = req.body; // Only need this one from frontend
        if (!fbAccessToken) { return res.status(400).json({ success: false, message: 'Facebook Access Token is required' }); }

        // 3. Exchange for LONG-LIVED token immediately
        const { longLivedToken, expiresIn } = await exchangeForLongLivedUserToken(fbAccessToken);
        
        // 4. Find ALL linked Instagram Accounts using the LONG-LIVED token
        const availableAccounts = await findInstagramAccounts(longLivedToken);
        
        // Calculate expiry timestamp for the LLT
        const expiryTimestamp = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;

        // 5. Return list of accounts AND the long-lived token details
        return res.status(200).json({ 
            success: true, 
            accounts: availableAccounts,
            fbUserAccessToken: longLivedToken, // Pass back LLT for potential use in linking step
            fbTokenExpiry: expiryTimestamp
        });

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        return res.status(500).json({ success: false, message: error.message || 'Error processing Instagram connection.' });
    }
} 