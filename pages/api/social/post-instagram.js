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

// Main posting logic
async function postToInstagram(igUserId, accessToken, caption, imageUrls) {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('At least one image URL is required.');
  }

  // --- Single Image Post ---
  if (imageUrls.length === 1) {
    // 1. Create media container
    const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const formData = new URLSearchParams();
    formData.append('image_url', imageUrls[0]);
    formData.append('caption', caption);
    formData.append('access_token', accessToken);
    const createRes = await fetch(createUrl, { method: 'POST', body: formData });
    const createData = await createRes.json();
    if (!createRes.ok || createData.error || !createData.id) {
      throw new Error(createData?.error?.message || 'Failed to create IG media container.');
    }
    // 2. Poll for status
    const ready = await pollMediaContainerStatus(igUserId, createData.id, accessToken);
    if (!ready) throw new Error('Instagram media container not ready after polling.');
    // 3. Publish
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    const publishForm = new URLSearchParams();
    publishForm.append('creation_id', createData.id);
    publishForm.append('access_token', accessToken);
    const publishRes = await fetch(publishUrl, { method: 'POST', body: publishForm });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error || !publishData.id) {
      throw new Error(publishData?.error?.message || 'Failed to publish IG media.');
    }
    return { success: true, postId: publishData.id, type: 'single_photo' };
  }
  // --- Carousel Post ---
  else {
    // 1. Validate image count for carousel
    if (imageUrls.length < 2 || imageUrls.length > 10) {
      throw new Error('Instagram carousels require at least 2 and at most 10 images.');
    }
    // 2. Create child media containers
    const childIds = [];
    for (const imageUrl of imageUrls) {
      const createUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
      const formData = new URLSearchParams();
      formData.append('image_url', imageUrl);
      formData.append('is_carousel_item', 'true');
      formData.append('access_token', accessToken);
      const createRes = await fetch(createUrl, { method: 'POST', body: formData });
      const createData = await createRes.json();
      if (!createRes.ok || createData.error || !createData.id) {
        console.error('Failed to create IG carousel child media:', createData);
        throw new Error(createData?.error?.message || 'Failed to create IG carousel child media.');
      }
      // Poll for each child
      const ready = await pollMediaContainerStatus(igUserId, createData.id, accessToken);
      if (!ready) {
        console.error('Instagram carousel child media not ready after polling:', createData.id);
        throw new Error('Instagram carousel child media not ready after polling.');
      }
      childIds.push(createData.id);
    }
    // Log child IDs
    console.log('IG carousel child IDs:', childIds);
    // 3. Create parent carousel container
    const parentUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const parentForm = new URLSearchParams();
    parentForm.append('media_type', 'CAROUSEL');
    parentForm.append('caption', caption);
    childIds.forEach((id) => parentForm.append('children', id));
    parentForm.append('access_token', accessToken);
    const parentRes = await fetch(parentUrl, { method: 'POST', body: parentForm });
    const parentData = await parentRes.json();
    if (!parentRes.ok || parentData.error || !parentData.id) {
      console.error('Failed to create IG carousel parent container:', parentData);
      throw new Error(parentData?.error?.message || 'Failed to create IG carousel parent container.');
    }
    // 4. Poll for parent
    const ready = await pollMediaContainerStatus(igUserId, parentData.id, accessToken);
    if (!ready) {
      console.error('Instagram carousel parent container not ready after polling:', parentData.id);
      throw new Error('Instagram carousel parent container not ready after polling.');
    }
    // 5. Publish
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    const publishForm = new URLSearchParams();
    publishForm.append('creation_id', parentData.id);
    publishForm.append('access_token', accessToken);
    const publishRes = await fetch(publishUrl, { method: 'POST', body: publishForm });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error || !publishData.id) {
      console.error('Failed to publish IG carousel:', publishData);
      throw new Error(publishData?.error?.message || 'Failed to publish IG carousel.');
    }
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
    const { caption, imageUrls } = req.body;
    if (!caption || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: 'Caption and at least one image URL are required.' });
    }
    // 4. Posting logic
    const postResult = await postToInstagram(instagramUserId, facebookPageAccessToken, caption, imageUrls);
    // 5. Return success
    return res.status(200).json({
      success: true,
      message: `Successfully posted ${postResult.type === 'carousel' ? 'carousel' : 'photo'} to Instagram account.`,
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