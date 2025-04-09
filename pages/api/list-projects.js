import fetch from 'node-fetch';

// List all projects for a master API key
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get your master API key from environment variables
    const masterApiKey = process.env.BANNERBEAR_API_KEY;
    
    if (!masterApiKey) {
      return res.status(500).json({ message: 'Master API key not configured' });
    }
    
    if (!masterApiKey.startsWith('bb_ma_')) {
      return res.status(400).json({ message: 'Not a valid master API key' });
    }
    
    console.log('Listing projects using master key:', masterApiKey.substring(0, 10) + '...');
    
    // Make the API call to list projects
    const response = await fetch('https://api.bannerbear.com/v2/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${masterApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bannerbear API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        message: `Error listing projects: ${response.status}`,
        details: errorText 
      });
    }
    
    // Parse the response
    const data = await response.json();
    console.log('Retrieved projects:', data);
    
    // Return project information
    return res.status(200).json({
      message: 'Retrieved projects',
      projects: data
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return res.status(500).json({ 
      message: 'Error listing projects',
      error: error.message
    });
  }
} 