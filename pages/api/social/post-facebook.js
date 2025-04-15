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

// Updated function to post single or multiple photos to Facebook Page
async function postToFacebookPage(pageId, pageAccessToken, caption, imageUrls) {
    if (!imageUrls || imageUrls.length === 0) {
        throw new Error('At least one image URL is required.');
    }

    // --- Single Image Post ---
    if (imageUrls.length === 1) {
        const postUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        const formData = new URLSearchParams();
        formData.append('access_token', pageAccessToken);
        formData.append('caption', caption);
        formData.append('url', imageUrls[0]); 

        try {
            console.log(`Attempting to post single photo to FB Page ${pageId}...`);
            const response = await fetch(postUrl, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok || data.error) {
                console.error(`Error posting single photo to FB Page ${pageId}:`, data?.error);
                throw new Error(data?.error?.message || `Failed to post single photo (Status: ${response.status}).`);
            }
            console.log(`Successfully posted single photo to FB Page ${pageId}. Post ID: ${data.post_id || data.id}`);
            return { success: true, postId: data.post_id || data.id, type: 'single_photo' };
        } catch (error) {
            console.error("Error in postToFacebookPage (single photo):", error);
            throw error; 
        }
    } 
    // --- Multi-Image (Carousel) Post ---
    else {
        const uploadedPhotoIds = [];
        try {
            // 1. Upload each photo as unpublished
            console.log(`Uploading ${imageUrls.length} photos as unpublished for page ${pageId}...`);
            for (const imageUrl of imageUrls) {
                const uploadUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
                const photoFormData = new URLSearchParams();
                photoFormData.append('access_token', pageAccessToken);
                photoFormData.append('url', imageUrl);
                photoFormData.append('published', 'false'); // Upload unpublished

                const response = await fetch(uploadUrl, { method: 'POST', body: photoFormData });
                const data = await response.json();

                if (!response.ok || data.error || !data.id) {
                     console.error(`Error uploading unpublished photo (${imageUrl}) for page ${pageId}:`, data?.error);
                     throw new Error(data?.error?.message || `Failed to upload unpublished photo (Status: ${response.status}).`);
                }
                console.log(` > Uploaded unpublished photo ${data.id}`);
                uploadedPhotoIds.push(data.id);
            }

            // 2. Create the feed post with attached media
            console.log(`Creating feed post on page ${pageId} with ${uploadedPhotoIds.length} attached photos...`);
            const feedUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
            const feedFormData = new URLSearchParams();
            feedFormData.append('access_token', pageAccessToken);
            feedFormData.append('message', caption); // Caption goes in 'message' for feed posts

            // Format attached_media parameter as array of objects
            uploadedPhotoIds.forEach((photoId, index) => {
                 feedFormData.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: photoId }));
            });

            const feedResponse = await fetch(feedUrl, { method: 'POST', body: feedFormData });
            const feedData = await feedResponse.json();

            if (!feedResponse.ok || feedData.error || !feedData.id) {
                console.error(`Error creating carousel feed post for Page ${pageId}:`, feedData?.error);
                throw new Error(feedData?.error?.message || `Failed to create carousel feed post (Status: ${feedResponse.status}).`);
            }

            console.log(`Successfully posted carousel to FB Page ${pageId}. Post ID: ${feedData.id}`);
            return { success: true, postId: feedData.id, type: 'carousel' };

        } catch (error) {
             console.error("Error in postToFacebookPage (carousel):", error);
             // Consider cleanup logic for unpublished photos on failure
             throw error;
        }
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        // 1. Authenticate Trofai User via Session Token
        const session = getSessionFromHeader(req);
        if (!session) { return res.status(401).json({ success: false, message: 'Authentication required' }); }
        
        const userResponse = await dynamoDb.query(tables.users.tableName, { /* ... query params ... */ 
            IndexName: tables.users.indexes.bySession.indexName,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        });
        if (!userResponse || !userResponse.Items || !userResponse.Items.length === 0) { return res.status(401).json({ success: false, message: 'Invalid session' }); }
        
        const userData = userResponse.Items[0];
        const userId = userData.userId;
        console.log(`FB Post: Session valid for user ${userId}`);

        // 2. Check if FB Page is connected for this user
        const { facebookPageId, facebookPageAccessToken } = userData;
        if (!facebookPageId || !facebookPageAccessToken) {
            return res.status(400).json({ success: false, message: 'Facebook Page not connected or access token missing.' });
        }
        
        // 3. Get post content from request body
        const { caption, imageUrls } = req.body;
        if (!caption || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            return res.status(400).json({ success: false, message: 'Caption and at least one image URL are required.' });
        }

        // --- Posting Logic --- 
        // Call the updated helper function, passing the full array
        const postResult = await postToFacebookPage(facebookPageId, facebookPageAccessToken, caption, imageUrls);

        // 4. Return Success (adjust message based on result type)
        return res.status(200).json({ 
            success: true, 
            message: `Successfully posted ${postResult.type === 'carousel' ? 'carousel' : 'photo'} to Facebook Page.`, 
            postId: postResult.postId 
        });

    } catch (error) {
        console.error('Error posting to Facebook:', error);
        // Provide more specific feedback if possible (e.g., token expired)
        return res.status(500).json({
            success: false,
            message: error.message || 'An internal server error occurred while posting to Facebook.',
        });
    }
} 