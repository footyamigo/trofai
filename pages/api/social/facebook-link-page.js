import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';
import fetch from 'node-fetch';

// Load FB App Credentials from Env Vars
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

// Function to exchange short-lived user token for a long-lived one
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
      return {
          longLivedToken: data.access_token, 
          expiresIn: data.expires_in // Seconds until expiry (approx 60 days)
      };

  } catch (error) {
      console.error('Exception during token exchange:', error);
      throw error;
  }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userResponse = await dynamoDb.query(tables.users.tableName, {
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
         if (!userResponse || !userResponse.Items || userResponse.Items.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
        const userId = userResponse.Items[0].userId;
        console.log(`FB Link Page: Session valid for user ${userId}`);

        // 2. Get selected Page details and original short-lived FB user token
        const { fbPageId, fbPageName, fbPageAccessToken, facebookUserId, fbUserAccessToken } = req.body;
        if (!fbPageId || !fbPageName || !fbPageAccessToken || !facebookUserId || !fbUserAccessToken) {
            return res.status(400).json({ success: false, message: 'Missing required Facebook Page details or user token' });
        }

        // 3. Exchange short-lived user token for a long-lived one
        const { longLivedToken, expiresIn } = await exchangeForLongLivedUserToken(fbUserAccessToken);
        
        // Calculate expiry timestamp (optional but good practice)
        const expiryTimestamp = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;

        // 4. Prepare data to save (using long-lived user token)
        const updateData = {
            facebookUserId: facebookUserId, 
            facebookPageId: fbPageId,
            facebookPageName: fbPageName,
            facebookPageAccessToken: fbPageAccessToken, // Page token should also be long-lived now
            facebookUserAccessToken: longLivedToken, // Store the long-lived USER token
            facebookTokenExpiry: expiryTimestamp, // Store expiry time
            facebookConnectedAt: new Date().toISOString(),
        };

        // 5. Save to DynamoDB
        console.log(`Linking Facebook Page ${fbPageId} (${fbPageName}) for user ${userId} with long-lived token.`);
        await usersDb.updateUser(userId, updateData);
        console.log(`Successfully linked Facebook Page ${fbPageId} for user ${userId}`);

        // 6. Return Success
        return res.status(200).json({ 
            success: true, 
            message: `Facebook Page (${fbPageName}) linked successfully.` 
        });

    } catch (error) {
        console.error('Error linking Facebook Page:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while linking the Facebook Page.',
        });
    }
} 