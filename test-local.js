// Simple test script for local API testing
const fetch = require('node-fetch');

// Rightmove property URL to test with
const testUrl = 'https://www.rightmove.co.uk/properties/159878753#/?channel=RES_LET';

async function testLocalApi() {
  try {
    console.log('Testing with URL:', testUrl);
    
    const response = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: testUrl })
    });
    
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('Processed successfully!');
      console.log('Bannerbear UID:', data.data.bannerbear.uid);
      console.log('Status:', data.data.bannerbear.status);
      console.log('Type:', data.data.bannerbear.type);
      console.log('Number of images found:', data.data.property.images.length);
      console.log('First image URL:', data.data.property.images[0]);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
    }
  } catch (error) {
    console.error('Error testing local API:', error);
  }
}

// Run the test
testLocalApi(); 