import fetch from 'node-fetch';

const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;
const PIPEDREAM_URL = 'https://fe75580bcc3b99cd4e2b3e17187df9f1.m.pipedream.net';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  try {
    console.log('Checking status for UID:', uid);
    
    // Try getting status from Bannerbear directly first
    const status = await getStatusFromBannerbear(uid, req.query.type === 'collection');
    
    if (status) {
      console.log('Got status from Bannerbear API:', status.status);
      return res.status(200).json(status);
    }

    // If we can't get status from Bannerbear, return not found
    console.log('Status not found in Bannerbear API');
    return res.status(404).json({ 
      message: 'Status not found',
      uid,
      status: 'unknown',
      type: req.query.type || 'unknown'
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      uid,
      status: 'error',
      type: req.query.type || 'unknown'
    });
  }
}

async function getStatusFromBannerbear(uid, isCollection = false) {
  try {
    const apiUrl = isCollection 
      ? `https://api.bannerbear.com/v2/collections/${uid}`
      : `https://api.bannerbear.com/v2/images/${uid}`;
    
    console.log(`Checking Bannerbear status directly for ${isCollection ? 'collection' : 'image'} ${uid}`);
    
    // Use the API key from the environment
    const apiKey = BANNERBEAR_API_KEY;
    console.log('Using API key:', apiKey ? `${apiKey.substring(0, 6)}...` : 'Not set');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Bannerbear API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Error response:', text);
      return null;
    }

    const data = await response.json();
    
    console.log('Bannerbear direct status check result:', {
      uid: data.uid,
      status: data.status,
      hasImageUrls: !!data.image_urls && Object.keys(data.image_urls || {}).length,
      hasImages: !!data.images && data.images.length,
      hasZipUrl: !!data.zip_url
    });
    
    // Return all the data from Bannerbear in a consistent format
    return {
      uid: data.uid,
      status: data.status,
      type: isCollection ? 'collection' : 'single',
      image_url: data.image_url,
      image_url_png: data.image_url_png,
      image_url_jpg: data.image_url_jpg,
      created_at: data.created_at,
      updated_at: data.updated_at,
      image_urls: data.image_urls || {},
      images: data.images || [],
      template_set: data.template_set,
      zip_url: data.zip_url,
      metadata: data.metadata,
      last_checked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking Bannerbear directly:', error);
    return null;
  }
} 