// Simple test script for direct Roborabbit API testing
require('dotenv').config();
const fetch = require('node-fetch');

// Rightmove property URL to test with
const testUrl = 'https://www.rightmove.co.uk/properties/159878753#/?channel=RES_LET';

// API credentials
const ROBORABBIT_API_KEY = process.env.ROBORABBIT_API_KEY;
const TASK_UID = process.env.TASK_UID;

async function testRoborabbit() {
  try {
    console.log('Testing Roborabbit with URL:', testUrl);
    
    // Clean the URL
    const cleanedUrl = testUrl.split('/properties/')[1].split(/[#?]/)[0];
    const finalUrl = `https://www.rightmove.co.uk/properties/${cleanedUrl}`;
    console.log('Cleaned URL:', finalUrl);
    
    // Create request payload
    const data = {
      "steps": [
        {
          "uid": "w1AE6azd8n7dzxWnYp",
          "action": "go",
          "config": {
            "url": finalUrl
          }
        }
      ]
    };
    
    console.log('Request payload:', JSON.stringify(data, null, 2));
    
    // Call Roborabbit API
    const response = await fetch(`https://api.roborabbit.com/v1/tasks/${TASK_UID}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ROBORABBIT_API_KEY}`
      },
      body: JSON.stringify(data)
    });
    
    // Get the response as text
    const responseText = await response.text();
    console.log('Raw Roborabbit API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Roborabbit API error: ${response.status} - ${responseText}`);
    }
    
    // Parse the response
    const runData = JSON.parse(responseText);
    console.log('Parsed Roborabbit API Response:', runData);
    
    if (!runData.uid) {
      throw new Error('No run ID returned from Roborabbit');
    }
    
    // Poll for results
    console.log('Starting polling with run ID:', runData.uid);
    const results = await pollForResults(runData.uid);
    
    // Process the results
    processResults(results);
  } catch (error) {
    console.error('Error in test:', error);
  }
}

async function pollForResults(runUid) {
  const MAX_POLLING_ATTEMPTS = 30;
  const POLLING_INTERVAL_MS = 2000;
  let attempts = 0;

  const poll = async () => {
    if (attempts >= MAX_POLLING_ATTEMPTS) {
      throw new Error('Max polling attempts reached');
    }

    attempts++;
    console.log(`Polling attempt ${attempts}...`);

    const response = await fetch(`https://api.roborabbit.com/v1/tasks/${TASK_UID}/runs/${runUid}`, {
      headers: {
        'Authorization': `Bearer ${ROBORABBIT_API_KEY}`
      }
    });

    const responseText = await response.text();
    console.log(`Raw polling response (attempt ${attempts}):`, responseText.substring(0, 200) + '...');

    if (!response.ok) {
      throw new Error(`Failed to poll results: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log(`Poll status (attempt ${attempts}):`, data.status);

    if (data.status === 'finished' && data.outputs) {
      console.log('Scraping completed successfully!');
      return data;
    } else if (data.status === 'failed') {
      throw new Error(`Scraping failed: ${data.error || 'Unknown error'}`);
    }

    // If still pending, wait and try again
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    return poll();
  };

  return await poll();
}

function processResults(data) {
  console.log('Processing raw data (first 200 chars):', JSON.stringify(data).substring(0, 200) + '...');

  // Get the first output key that contains the structured data
  const outputKeys = Object.keys(data.outputs || {});
  console.log('Available output keys:', outputKeys);

  // Find the key that contains the data
  const outputKey = outputKeys.find(key => key.includes('save_structured_data'));
  
  if (!outputKey) {
    console.error('No structured data found in outputs');
    return;
  }

  console.log('Using output key:', outputKey);
  const propertyData = data.outputs[outputKey];
  
  // Check if property_images exists and is an array
  if (!propertyData.property_images) {
    console.error('property_images does not exist in the data');
    return;
  }
  
  console.log('property_images type:', typeof propertyData.property_images);
  console.log('Is Array:', Array.isArray(propertyData.property_images));
  console.log('Length:', propertyData.property_images.length);
  
  if (Array.isArray(propertyData.property_images)) {
    // Log the first few images
    for (let i = 0; i < Math.min(propertyData.property_images.length, 3); i++) {
      console.log(`Image ${i}:`, propertyData.property_images[i]);
    }
  }
  
  console.log('All data processed successfully!');
}

// Run the test
testRoborabbit(); 