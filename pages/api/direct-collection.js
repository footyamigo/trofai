import fetch from 'node-fetch';

// The simplest API endpoint for Bannerbear collections or images
export default async function handler(req, res) {
  const uid = req.query.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }
  
  // Project API key from environment variables
  const apiKey = process.env.BANNERBEAR_API_KEY;
  console.log('Using API key:', apiKey);
  
  // Check if it's a master key (starts with bb_ma_)
  const isMasterKey = apiKey.startsWith('bb_ma_');
  
  try {
    // First try collections endpoint
    let success = await tryEndpoint('collections', uid, apiKey, isMasterKey, res);
    
    // If that fails, try the images endpoint 
    if (!success) {
      success = await tryEndpoint('images', uid, apiKey, isMasterKey, res);
      
      // If that also fails, return a generic error
      if (!success) {
        return res.status(404).json({ 
          error: `Item with UID ${uid} not found in either collections or images` 
        });
      }
    }
    
    // If we got here, one of the endpoints already returned a response
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper function to try a specific endpoint type
async function tryEndpoint(type, uid, apiKey, isMasterKey, res) {
  try {
    // Build the URL with project_id if needed
    let apiUrl = `https://api.bannerbear.com/v2/${type}/${uid}`;
    const projectId = process.env.BANNERBEAR_PROJECT_ID || 'E56OLrMKYWnzwl3oQj';
    
    if (isMasterKey) {
      // Add project_id parameter for master API keys
      apiUrl += `?project_id=${projectId}`;
      console.log(`Trying ${type} with Master API key and project_id:`, apiUrl);
    } else {
      console.log(`Trying ${type} with Project API key:`, apiUrl);
    }
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status} for ${type}:`, errorText);
      return false; // Indicates we should try another endpoint
    }
    
    // Success - send the response
    const data = await response.json();
    console.log(`Successfully found item in ${type}`);
    res.status(200).json(data);
    return true; // Indicates success
  } catch (error) {
    console.error(`Error with ${type} endpoint:`, error);
    return false; // Indicates we should try another endpoint
  }
} 