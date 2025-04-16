import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';
import fetch from 'node-fetch';

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Updated function to fetch ALL Instagram Accounts with pagination
async function findInstagramAccounts(fbAccessToken) {
    let allIgAccounts = [];
    // Request pages and linked IG accounts, increase limit
    let accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url}&limit=100&access_token=${fbAccessToken}`;
    
    try {
        console.log('Querying FB Graph API for pages and linked IG accounts (handling pagination)...');
        
        while (accountsUrl) {
            console.log(`Fetching IG account data from: ${accountsUrl.substring(0, 100)}...`);
            const response = await fetch(accountsUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error("Error fetching FB pages/IG accounts batch:", data?.error);
                if (data?.error?.code === 200) { throw new Error('Permission denied fetching Pages/IG Accounts.'); }
                throw new Error(data?.error?.message || 'Failed to fetch FB pages/IG accounts batch.');
            }
            
            // Collect linked Instagram accounts from the current batch
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

            // Check for the next page URL
            if (data.paging && data.paging.next) {
                accountsUrl = data.paging.next;
            } else {
                accountsUrl = null; // No more pages
            }
        }

        console.log(`Found ${allIgAccounts.length} linked Instagram account(s) in total.`);
        return allIgAccounts; 

    } catch (error) {
        console.error("Error in findInstagramAccounts (pagination loop):", error);
        throw error; 
    }
}

// This API route now only FETCHES the available accounts, it doesn't save them yet.
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) {
           console.log('IG Connect (Fetch): Auth required');
           return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        console.log('IG Connect (Fetch): Validating session via DynamoDB...');
        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
        if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
           console.log('IG Connect (Fetch): Invalid session');
           return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        const userId = userResponse.Items[0].userId;
        console.log(`IG Connect (Fetch): Session valid for user ${userId}`);

        // 2. Get Facebook access token from request body
        const { fbAccessToken } = req.body;
        if (!fbAccessToken) {
            return res.status(400).json({ success: false, message: 'Facebook Access Token is required' });
        }

        // 3. Find ALL linked Instagram Business Accounts
        const availableAccounts = await findInstagramAccounts(fbAccessToken);

        // 4. Return the list of found accounts (or empty list)
        return res.status(200).json({ 
            success: true, 
            accounts: availableAccounts 
        });

    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while fetching Instagram accounts.',
        });
    }
} 