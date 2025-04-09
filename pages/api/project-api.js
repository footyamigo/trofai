import fetch from 'node-fetch';

// Simple utility to create a new project API key (one-time setup)
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
    
    console.log('Creating project API key using master key:', masterApiKey.substring(0, 10) + '...');
    
    // Make the API call to create a project API key
    const response = await fetch('https://api.bannerbear.com/v2/auth/keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${masterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Trofai Project Key',
        scopes: ['*'] // All scopes
      })
    });
    
    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bannerbear API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        message: `Error creating project API key: ${response.status}`,
        details: errorText 
      });
    }
    
    // Parse the response
    const data = await response.json();
    console.log('Created new project API key:', data);
    
    // Return the new project API key
    return res.status(200).json({
      message: 'Created new project API key',
      key: data.api_key,
      // Include instructions on how to use it
      instructions: 'Add this API key to your .env file as BANNERBEAR_PROJECT_API_KEY'
    });
  } catch (error) {
    console.error('Error creating project API key:', error);
    return res.status(500).json({ 
      message: 'Error creating project API key',
      error: error.message
    });
  }
} 