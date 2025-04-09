require('dotenv').config();
const fetch = require('node-fetch');

async function testBannerbearApi() {
  // Collection UID to test
  const uid = 'Mg31VBprYDkA4NYm';
  
  // Get API key from environment
  const apiKey = process.env.BANNERBEAR_API_KEY;
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET');
  
  // Check if using master API key
  const isMasterApiKey = apiKey && apiKey.startsWith('bb_ma_');
  console.log('Using master API key:', isMasterApiKey);
  
  // Build API URL
  let apiUrl = `https://api.bannerbear.com/v2/collections/${uid}`;
  
  // Add project_id if using master API key
  if (isMasterApiKey) {
    apiUrl += '?project_id=trofai-test';
  }
  
  console.log('Making API request to:', apiUrl);
  
  try {
    // Make the request
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Check response status
    console.log('Response status:', response.status);
    
    // Parse response body
    const text = await response.text();
    console.log('Response body:', text);
    
    // If valid JSON, parse and display more details
    try {
      const data = JSON.parse(text);
      if (data.status) {
        console.log('Collection status:', data.status);
      }
      if (data.image_urls) {
        console.log('Image URLs:', Object.keys(data.image_urls).length);
      }
    } catch (e) {
      console.log('Not a valid JSON response');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testBannerbearApi(); 