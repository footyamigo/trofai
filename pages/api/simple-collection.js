import fetch from 'node-fetch';

// A simplified approach to directly get a Bannerbear collection by UID
export default async function handler(req, res) {
  // The collection UID to retrieve - hardcoded for simplicity
  const uid = req.query.uid || 'Mg31VBprYDkA4NYm';
  
  // Bannerbear API key - using the one from the dashboard
  const apiKey = process.env.BANNERBEAR_API_KEY;
  
  try {
    console.log(`Getting collection ${uid} with API key ${apiKey.substring(0, 10)}...`);
    
    // The URL to get the collection directly
    const url = `https://api.bannerbear.com/v2/collections/${uid}`;
    
    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    // Handle the response
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error ${response.status}:`, error);
      return res.status(response.status).json({ 
        error: `Failed to get collection: ${response.status}`,
        details: error
      });
    }
    
    // Parse the response
    const data = await response.json();
    console.log('Successfully retrieved collection:', data.uid);
    
    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error retrieving collection:', error);
    return res.status(500).json({ error: error.message });
  }
} 