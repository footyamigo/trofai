// Simple API endpoint to directly fetch data from Bannerbear API
// This bypasses the webhook and DynamoDB systems that weren't working

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid, type } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  const isCollection = type === 'collection';
  const apiPath = isCollection ? 'collections' : 'images';
  
  try {
    // Fetch directly from Bannerbear API
    console.log(`Fetching directly from Bannerbear API: ${apiPath}/${uid}`);
    
    const response = await fetch(`https://api.bannerbear.com/v2/${apiPath}/${uid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bannerbear API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        message: 'Error from Bannerbear API',
        status: response.status,
        error: errorText
      });
    }

    // Get the data
    const data = await response.json();
    
    // Log a summary of what we found
    if (isCollection) {
      console.log('Collection data summary:', {
        uid: data.uid,
        status: data.status,
        imageCount: Object.keys(data.image_urls || {}).length,
        imagesArrayCount: (data.images || []).length,
        hasZip: !!data.zip_url
      });
    } else {
      console.log('Image data summary:', {
        uid: data.uid,
        status: data.status,
        hasImageUrl: !!data.image_url,
        hasPngUrl: !!data.image_url_png,
        hasJpgUrl: !!data.image_url_jpg
      });
    }

    // Send the full API response back to client
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from Bannerbear:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
} 