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

// Function to fetch Instagram Business Account linked to Facebook Pages
async function findInstagramAccount(fbAccessToken) {
    // Request pages managed by the user and their linked IG accounts
    const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=name,access_token,instagram_business_account{id,username}&access_token=${fbAccessToken}`;
    
    try {
        console.log('Querying Facebook Graph API for pages and linked IG accounts...');
        const response = await fetch(accountsUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Error fetching FB pages:", data?.error);
            throw new Error(data?.error?.message || 'Failed to fetch Facebook pages. Ensure permissions are granted.');
        }
        
        if (!data.data || data.data.length === 0) {
            console.log('No Facebook pages found for this user.');
            return null; // No pages found
        }

        // Find the first page with a linked Instagram Business Account
        for (const page of data.data) {
            if (page.instagram_business_account) {
                console.log(`Found linked Instagram account: ${page.instagram_business_account.username} (ID: ${page.instagram_business_account.id}) on page ${page.name}`);
                return {
                    igUserId: page.instagram_business_account.id,
                    igUsername: page.instagram_business_account.username,
                    fbPageId: page.id,
                    fbPageAccessToken: page.access_token // IMPORTANT: This is a Page Access Token
                };
            }
        }

        // If loop completes without finding one
        console.log('No linked Instagram Business Account found on any managed pages.');
        return null; 
    } catch (error) {
        console.error("Error in findInstagramAccount:", error);
        throw error; // Re-throw to be caught by handler
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    let userId = null;

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) {
           console.log('IG Connect: Auth required');
           return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        console.log('IG Connect: Validating session via DynamoDB...');
        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
         if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
           console.log('IG Connect: Invalid session');
           return res.status(401).json({ success: false, message: 'Invalid session' });
         }
        userId = userResponse.Items[0].userId;
        console.log(`IG Connect: Session valid for user ${userId}`);

        // 2. Get Facebook access token from request body
        const { fbAccessToken } = req.body;
        if (!fbAccessToken) {
            return res.status(400).json({ success: false, message: 'Facebook Access Token is required' });
        }

        // 3. Find linked Instagram Business Account using the FB token
        const instagramInfo = await findInstagramAccount(fbAccessToken);

        if (!instagramInfo) {
            console.log(`No linked Instagram Business Account found for user ${userId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'No linked Instagram Business Account found. Please ensure your Instagram account is a Business/Creator account and linked to a Facebook Page.' 
            });
        }

        // 4. Store Instagram connection details in DynamoDB
        const updateData = {
            instagramUserId: instagramInfo.igUserId,
            instagramUsername: instagramInfo.igUsername,
            // Storing Page ID and Token is optional but can be useful for posting later
            facebookPageIdForInstagram: instagramInfo.fbPageId,
            facebookPageAccessTokenForInstagram: instagramInfo.fbPageAccessToken, // SECURITY: Encrypt this token!
            instagramConnectedAt: new Date().toISOString(),
            // Consider updating facebookAccessToken if it was refreshed during FB.login
        };

        console.log(`Updating user ${userId} with Instagram connection:`, { instagramUserId: instagramInfo.igUserId });
        await usersDb.updateUser(userId, updateData);
        console.log(`Successfully connected Instagram account for user ${userId}`);

        // 5. Return Success
        return res.status(200).json({ 
            success: true, 
            message: `Instagram account (${instagramInfo.igUsername || instagramInfo.igUserId}) connected successfully.` 
        });

    } catch (error) {
        console.error('Error connecting Instagram account:', error);
        // Return specific error message if available
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while connecting Instagram.',
        });
    }
} 