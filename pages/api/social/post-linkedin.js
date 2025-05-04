import { usersDb, dynamoDb } from '../../../src/aws/dynamoDb';
import tables from '../../../src/aws/dynamoDbSchema';
import fetch from 'node-fetch';

// Define LinkedIn API Version (use a recent version)
const LINKEDIN_API_VERSION = '202405'; // Trying May 2024 version

// Helper to extract token from Authorization header
const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Helper function to initialize image upload using /rest/images
async function initializeLinkedInUpload(accessToken, ownerUrn) {
    const initializeUrl = 'https://api.linkedin.com/rest/images?action=initializeUpload';
    const body = {
        initializeUploadRequest: { 
            owner: ownerUrn
        }
    };
    const bodyString = JSON.stringify(body);

    console.log(`LinkedIn Post (REST): Initializing image upload for owner ${ownerUrn}...`);
    try {
        const response = await fetch(initializeUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': LINKEDIN_API_VERSION,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Length': Buffer.byteLength(bodyString) // Explicitly add Content-Length
            },
            body: bodyString
        });
        const data = await response.json();

        // Check for successful response (usually 200 OK for initialize)
        if (!response.ok || !data.value?.uploadUrl || !data.value?.image) {
            console.error('LinkedIn Post (REST): Failed to initialize image upload. Status:', response.status);
            // Log the full error response data, especially errorDetails
            console.error('LinkedIn API Error Response:', JSON.stringify(data, null, 2)); 
            throw new Error(data?.message || 'Failed to initialize LinkedIn image upload (REST).');
        }
        console.log('LinkedIn Post (REST): Image upload initialized successfully.');
        return { 
            uploadUrl: data.value.uploadUrl, 
            imageUrn: data.value.image // The new image URN (urn:li:image:...) 
        };
    } catch (error) {
        console.error('Error initializing LinkedIn REST upload:', error);
        throw error;
    }
}

// Helper function to upload the image binary (remains largely the same, ensure PUT method)
async function uploadImageBinary(uploadUrl, imageUrl, accessToken) {
    console.log(`LinkedIn Post (REST): Fetching image binary from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageUrl}. Status: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.buffer(); 
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

    console.log(`LinkedIn Post (REST): Uploading image binary via PUT...`);
    try {
        // The upload URL usually doesn't require the Auth header, but Content-Type is important
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT', 
            headers: {
                // 'Authorization': `Bearer ${accessToken}`, // Often not needed for the direct upload URL
                'Content-Type': contentType,
            },
            body: imageBuffer
        });

        // Check for success (often 200 or 201, check LinkedIn specifics if errors)
        if (!uploadResponse.ok) {
            console.error('LinkedIn Post (REST): Failed to upload image binary. Status:', uploadResponse.status, await uploadResponse.text().catch(()=>''));
            throw new Error(`Failed to upload image binary to LinkedIn (REST). Status: ${uploadResponse.status}`);
        }
        console.log('LinkedIn Post (REST): Image binary uploaded successfully.');
        return true;
    } catch (error) {
        console.error('Error uploading image binary to LinkedIn (REST):', error);
        throw error;
    }
}

// Helper function to create the Post using /rest/posts
async function createLinkedInRestPost(accessToken, authorUrn, caption, imageUrn) {
    const postUrl = 'https://api.linkedin.com/rest/posts';
    const body = {
        author: authorUrn, // Can be member URN (urn:li:person:...) or org URN
        commentary: caption, // Use commentary field
        visibility: "PUBLIC", // Or "CONNECTIONS"
        distribution: { // Required distribution object
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },
        content: { // Use content object
            media: { // Use media object
                // title: "Property Image via Trofai", // Optional title
                id: imageUrn // Reference the uploaded image URN here
                // altText: "Alternate text for the image" // Optional alt text
            }
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
    };

    console.log(`LinkedIn Post (REST): Creating post for author ${authorUrn}...`);
    try {
        const response = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': LINKEDIN_API_VERSION,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(body)
        });

        // Check for 201 Created status code
        if (response.status !== 201) { 
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            console.error('LinkedIn Post (REST): Failed to create post. Status:', response.status, errorData);
            throw new Error(errorData?.message || `Failed to create LinkedIn post (REST). Status: ${response.status}`);
        }

        const postId = response.headers.get('x-linkedin-id') || response.headers.get('x-restli-id'); // Get post ID from header
        console.log(`LinkedIn Post (REST): Successfully created post. Post ID: ${postId}`);
        return { success: true, postId: postId };

    } catch (error) {
        console.error('Error creating LinkedIn REST post:', error);
        throw error;
    }
}

// Add this helper for multi-image posts
async function createLinkedInMultiImagePost(accessToken, authorUrn, caption, imageUrns) {
    const postUrl = 'https://api.linkedin.com/rest/posts';
    const body = {
        author: authorUrn,
        commentary: caption,
        visibility: "PUBLIC",
        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: []
        },
        content: {
            multiImage: {
                images: imageUrns // Array of { id, altText }
            }
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false
    };
    console.log(`LinkedIn Post (REST): Creating multi-image post for author ${authorUrn}...`);
    try {
        const response = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': LINKEDIN_API_VERSION,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(body)
        });
        if (response.status !== 201) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
            console.error('LinkedIn Post (REST): Failed to create multi-image post. Status:', response.status, errorData);
            throw new Error(errorData?.message || `Failed to create LinkedIn multi-image post (REST). Status: ${response.status}`);
        }
        const postId = response.headers.get('x-linkedin-id') || response.headers.get('x-restli-id');
        console.log(`LinkedIn Post (REST): Successfully created multi-image post. Post ID: ${postId}`);
        return { success: true, postId: postId };
    } catch (error) {
        console.error('Error creating LinkedIn REST multi-image post:', error);
        throw error;
    }
}

// --- Main Handler ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    let userId = null;
    let userData = null;

    try {
        // 1. Authenticate Trofai User
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
        userData = userResponse.Items[0];
        userId = userData.userId;
        console.log(`LinkedIn Post (REST): Session valid for user ${userId}`);

        // 2. Get LinkedIn Credentials
        let { linkedinUrn, linkedinAccessToken } = userData;
        if (!linkedinUrn || !linkedinAccessToken) {
            return res.status(400).json({ success: false, message: 'LinkedIn account not connected or access token missing.' });
        }
        // Patch: Ensure linkedinUrn is a full URN
        if (!linkedinUrn.startsWith('urn:li:')) {
            linkedinUrn = `urn:li:person:${linkedinUrn}`;
        }
        // TODO: Check token expiry

        // 3. Get Post Content
        const { caption, imageUrls } = req.body;
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 1) {
            return res.status(400).json({ success: false, message: 'At least one image URL is required for LinkedIn posts.' });
        }
        if (imageUrls.length > 9) {
            return res.status(400).json({ success: false, message: 'LinkedIn multi-image posts support a maximum of 9 images.' });
        }
        if (!caption || caption.trim() === '') {
            return res.status(400).json({ success: false, message: 'Caption is required for LinkedIn posts.' });
        }

        // 4. LinkedIn Posting Flow using REST APIs
        // For each image, initialize upload and upload binary, collect image URNs
        const imageUrns = [];
        for (let i = 0; i < imageUrls.length; i++) {
            const { uploadUrl, imageUrn } = await initializeLinkedInUpload(linkedinAccessToken, linkedinUrn);
            await uploadImageBinary(uploadUrl, imageUrls[i], linkedinAccessToken);
            imageUrns.push({ id: imageUrn, altText: `Image ${i+1}` }); // Optionally, you can use a better altText
        }

        // 4c. Create Post
        let postResult;
        if (imageUrns.length === 1) {
            // Single image: use original logic
            postResult = await createLinkedInRestPost(linkedinAccessToken, linkedinUrn, caption, imageUrns[0].id);
        } else {
            // Multi-image: use multiImage object
            postResult = await createLinkedInMultiImagePost(linkedinAccessToken, linkedinUrn, caption, imageUrns);
        }

        // 5. Return success response
        return res.status(200).json({ 
            success: true, 
            message: 'Successfully posted to LinkedIn.', 
            postId: postResult.postId 
        });

    } catch (error) {
        console.error(`LinkedIn Post (REST) Error for user ${userId || 'UNKNOWN'}:`, error);
        const errorMessage = error.message || 'Failed to post to LinkedIn (REST).';
        const statusCode = error.message.includes('account not connected') || error.message.includes('Invalid session') ? 400 : 500;
        return res.status(statusCode).json({ 
            success: false, 
            message: errorMessage 
        });
    }
} 