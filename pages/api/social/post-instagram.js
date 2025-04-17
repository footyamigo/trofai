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

// Helper to poll for IG media container status
async function pollMediaContainerStatus(igUserId, creationId, accessToken, maxAttempts = 10, intervalMs = 2000) {
  let attempt = 0;
  while (attempt < maxAttempts) {
    const statusUrl = `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${accessToken}`;
    const response = await fetch(statusUrl);
    const data = await response.json();
    if (data.status_code === 'FINISHED') {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempt++;
  }
  return false;
}

// Main posting logic - updated to handle postType
async function postToInstagram(igUserId, accessToken, caption, imageUrls, postType = 'feed') {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('At least one image URL is required.');
  }

  // --- Story Post ---
  if (postType === 'story') {
    if (imageUrls.length > 1) {
      throw new Error('Instagram Stories can only contain one image or video at a time.');
    }
    
    console.log(`Attempting to post Instagram Story for IG User ${igUserId}`);
    
    // 1. Create story media container with media_type=STORIES
    const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrls[0]); 
    formData.append('media_type', 'STORIES'); // Critical: must specify STORIES type
    formData.append('access_token', accessToken);
    
    // Caption is optional for stories
    if (caption && caption.trim() !== '') {
      formData.append('caption', caption);
    }
    
    const createRes = await fetch(createUrl, { method: 'POST', body: formData });
    const createData = await createRes.json();
    
    if (!createRes.ok || createData.error || !createData.id) {
      console.error('Failed to create IG story container:', createData);
      throw new Error(createData?.error?.message || 'Failed to create IG story container.');
    }
    
    // 2. Poll for status
    const ready = await pollMediaContainerStatus(igUserId, createData.id, accessToken);
    if (!ready) {
      console.error('Instagram story container not ready after polling:', createData.id);
      throw new Error('Instagram story container not ready after polling.');
    }
    
    // 3. Publish story container
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    const publishForm = new URLSearchParams();
    publishForm.append('creation_id', createData.id);
    publishForm.append('access_token', accessToken);
    
    const publishRes = await fetch(publishUrl, { method: 'POST', body: publishForm });
    const publishData = await publishRes.json();
    
    if (!publishRes.ok || publishData.error || !publishData.id) {
      console.error('Failed to publish IG story:', publishData);
      throw new Error(publishData?.error?.message || 'Failed to publish IG story.');
    }
    
    console.log(`Successfully posted Story to IG. Post ID: ${publishData.id}`);
    return { success: true, postId: publishData.id, type: 'story' };
  }
  
  // --- Single Image Post ---
  else if (imageUrls.length === 1) {
    console.log(`Attempting to post single Feed photo for IG User ${igUserId}`);
    // ... (existing single image feed logic: /media then /media_publish) ...
    // (Ensure no media_type=STORIES is added here)
    const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrls[0]);
    formData.append('caption', caption);
    formData.append('access_token', accessToken);
    const createRes = await fetch(createUrl, { method: 'POST', body: formData });
    const createData = await createRes.json();
    if (!createRes.ok || createData.error || !createData.id) { throw new Error(createData?.error?.message || 'Failed to create IG media container.'); }
    const ready = await pollMediaContainerStatus(igUserId, createData.id, accessToken);
    if (!ready) throw new Error('Instagram media container not ready after polling.');
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    const publishForm = new URLSearchParams();
    publishForm.append('creation_id', createData.id);
    publishForm.append('access_token', accessToken);
    const publishRes = await fetch(publishUrl, { method: 'POST', body: publishForm });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error || !publishData.id) { throw new Error(publishData?.error?.message || 'Failed to publish IG media.'); }
    console.log(`Successfully posted single Feed photo to IG. Post ID: ${publishData.id}`);
    return { success: true, postId: publishData.id, type: 'single_photo' };
  }
  // --- Carousel Post ---
  else {
    console.log(`Attempting to post Carousel Feed for IG User ${igUserId}`);
    // ... (existing carousel logic: children, parent, publish) ...
     if (imageUrls.length < 2 || imageUrls.length > 10) { throw new Error('Instagram carousels require 2-10 images.'); }
      const childIds = [];
      for (const imageUrl of imageUrls) {
        const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
        const formData = new URLSearchParams();
        formData.append('image_url', imageUrl);
        formData.append('is_carousel_item', 'true');
        formData.append('access_token', accessToken);
        const createRes = await fetch(createUrl, { method: 'POST', body: formData });
        const createData = await createRes.json();
        if (!createRes.ok || createData.error || !createData.id) { console.error('Failed to create IG carousel child media:', createData); throw new Error(createData?.error?.message || 'Failed to create IG carousel child media.'); }
        const ready = await pollMediaContainerStatus(igUserId, createData.id, accessToken);
        if (!ready) { console.error('IG carousel child media not ready:', createData.id); throw new Error('IG carousel child media not ready.'); }
        childIds.push(createData.id);
      }
      console.log('IG carousel child IDs:', childIds);
      const parentUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
      const parentBody = { media_type: 'CAROUSEL', caption: caption, children: childIds.join(','), access_token: accessToken };
      console.log('Creating parent carousel container with JSON body:', parentBody);
      const parentRes = await fetch(parentUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(parentBody) });
      const parentData = await parentRes.json();
      if (!parentRes.ok || parentData.error || !parentData.id) { console.error('Failed to create parent carousel container:', parentData); throw new Error(parentData?.error?.message || 'Failed to create parent carousel container.'); }
      const parentReady = await pollMediaContainerStatus(igUserId, parentData.id, accessToken);
      if (!parentReady) { console.error('Parent carousel container not ready:', parentData.id); throw new Error('Parent carousel container not ready.'); }
      const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
      const publishForm = new URLSearchParams();
      publishForm.append('creation_id', parentData.id);
      publishForm.append('access_token', accessToken);
      const publishRes = await fetch(publishUrl, { method: 'POST', body: publishForm });
      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error || !publishData.id) { console.error('Failed to publish IG carousel:', publishData); throw new Error(publishData?.error?.message || 'Failed to publish IG carousel.'); }
      console.log(`Successfully posted Carousel Feed to IG. Post ID: ${publishData.id}`);
      return { success: true, postId: publishData.id, type: 'carousel' };
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
    const userData = userResponse.Items[0];
    const userId = userData.userId;
    console.log(`IG Post: Session valid for user ${userId}`);
    // 2. Check if IG is connected
    const { instagramUserId, facebookPageAccessToken } = userData;
    if (!instagramUserId || !facebookPageAccessToken) {
      return res.status(400).json({ success: false, message: 'Instagram account not connected or access token missing.' });
    }
    // 3. Get post content
    const { caption, imageUrls, postType } = req.body;
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image URL is required.' });
    }
    // Caption validation only for feed posts
    if (postType !== 'story' && (!caption || caption.trim() === '')) {
      return res.status(400).json({ success: false, message: 'Caption is required for feed posts.' });
    }
    // 4. Posting logic - Pass postType to the helper
    const postResult = await postToInstagram(instagramUserId, facebookPageAccessToken, caption, imageUrls, postType);
    // 5. Return success - adjust message based on type
    let messageType = 'post';
    if (postResult.type === 'story') messageType = 'Story';
    else if (postResult.type === 'carousel') messageType = 'carousel';
    else if (postResult.type === 'single_photo') messageType = 'photo';
    
    return res.status(200).json({
      success: true,
      message: `Successfully posted ${messageType} to Instagram account.`,
      postId: postResult.postId
    });
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An internal server error occurred while posting to Instagram.'
    });
  }
} 