import fetch from 'node-fetch';

// Direct API call to Bannerbear - no webhooks needed
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  const isCollection = req.query.type === 'collection';
  
  try {
    console.log(`Checking Bannerbear status for ${isCollection ? 'collection' : 'image'}: ${uid}`);
    
    // Get your API key from environment variables
    const apiKey = process.env.BANNERBEAR_API_KEY;
    console.log('Using API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'Bannerbear API key not configured',
        error: 'MISSING_API_KEY'
      });
    }
    
    // Check if using master API key (starts with bb_ma_)
    const isMasterApiKey = apiKey.startsWith('bb_ma_');
    
    // For master API keys, we need to use a different approach than adding parameters
    // We'll check the UID via a list endpoint instead of a direct item endpoint
    
    if (isCollection && isMasterApiKey) {
      console.log('Using master API key approach to retrieve collection');
      try {
        // First try to call the collections list endpoint with a UID filter
        const listUrl = `https://api.bannerbear.com/v2/collections?uid=${uid}`;
        console.log('Calling Bannerbear List API URL:', listUrl);
        
        const listResponse = await fetch(listUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!listResponse.ok) {
          throw new Error(`Collection list API returned status ${listResponse.status}`);
        }
        
        const listData = await listResponse.json();
        console.log('List API response:', JSON.stringify(listData).substring(0, 100) + '...');
        
        // Check if we found the collection in the list
        if (listData && Array.isArray(listData) && listData.length > 0) {
          const collection = listData.find(item => item.uid === uid);
          if (collection) {
            return res.status(200).json(collection);
          }
        }
        
        // If we didn't find it in the list, try the direct endpoint
        throw new Error('Collection not found in list, trying direct endpoint');
      } catch (listError) {
        console.error('List approach failed:', listError.message);
        // Continue to try the direct approach
      }
    }
    
    // Choose the right endpoint based on if it's a collection or single image
    let apiUrl = isCollection 
      ? `https://api.bannerbear.com/v2/collections/${uid}`
      : `https://api.bannerbear.com/v2/images/${uid}`;
    
    // If using a master API key, we need to add project_id parameter
    if (isMasterApiKey) {
      // Try a few different project IDs as we don't know the exact one
      apiUrl += '?project_id=default';
    }
    
    console.log('Calling Bannerbear API URL:', apiUrl);
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Handle API errors
    if (!response.ok) {
      // If first try failed with project_id=default, try with a different project_id
      if (isMasterApiKey && apiUrl.includes('project_id=default')) {
        const alternativeUrl = apiUrl.replace('project_id=default', 'project_id=trofai');
        console.log('Retrying with alternative project_id:', alternativeUrl);
        
        const retryResponse = await fetch(alternativeUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          return res.status(200).json(data);
        }
      }
      
      const errorText = await response.text();
      console.error('Bannerbear API Error:', response.status, errorText);
      
      // Log with more details
      console.error('Request details:', {
        method: 'GET',
        url: apiUrl,
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/json'
        },
        isMasterApiKey
      });
      
      return res.status(response.status).json({ 
        message: `Bannerbear API error: ${response.status}`,
        details: errorText
      });
    }

    // Parse and return the data directly from Bannerbear
    const data = await response.json();
    console.log('API Response Status:', data.status);
    
    // For debug - show the available image URLs and keys
    if (data.image_urls) {
      console.log('Found image_urls with keys:', Object.keys(data.image_urls).join(', '));
    }
    if (data.images) {
      console.log('Found images array with length:', data.images.length);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking status:', error);
    return res.status(500).json({ 
      message: 'Error checking status', 
      error: error.message 
    });
  }
} 