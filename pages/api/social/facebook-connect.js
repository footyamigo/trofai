import { usersDb } from '../../../src/aws/dynamoDb'; // Assuming you have a users DB helper
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let userId = null; // Variable to store the authenticated userId

  try {
    // 1. Authenticate Trofai User via Session Token
    const session = getSessionFromHeader(req);
    if (!session) {
      console.log('FB Connect: No session token provided in header');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    console.log('FB Connect: Validating session via DynamoDB...');
    const userResponse = await usersDb.query(usersDb.tables.users.tableName, {
        IndexName: 'SessionIndex',
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
    userId = userData.userId; // Successfully authenticated and got userId
    console.log(`FB Connect: Session valid for user ${userId}`);

    // 2. Get Facebook token from request body
    const { accessToken, facebookUserId } = req.body;
    if (!accessToken || !facebookUserId) {
      return res.status(400).json({ success: false, message: 'Access token and Facebook User ID are required' });
    }

    // 3. Verify Facebook Token
    await verifyFacebookToken(accessToken, facebookUserId);

    // 4. Store connection details in DynamoDB
    const updateData = {
      facebookUserId: facebookUserId,
      facebookAccessToken: accessToken, // Store the token (consider encryption)
      facebookConnectedAt: new Date().toISOString(),
    };
    console.log(`Updating user ${userId} with Facebook connection:`, { facebookUserId: facebookUserId });
    await usersDb.updateUser(userId, updateData);
    console.log(`Successfully connected Facebook account for user ${userId}`);

    // 5. Return Success
    return res.status(200).json({ success: true, message: 'Facebook account connected successfully' });

  } catch (error) {
    console.error('Error connecting Facebook account:', error);
    // Provide specific messages for known errors
    if (error.message.includes('Facebook token user mismatch') || error.message.includes('Invalid Facebook access token')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    if (error.message.includes('Server configuration error')) {
       return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }
    // Generic error for other issues
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred while connecting Facebook.',
      error: error.message, // Avoid sending detailed stack traces in production
    });
  }
} 