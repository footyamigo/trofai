// Integration test that calls scrapeProperty and generateBannerbearImages
require('dotenv').config();
const fetch = require('node-fetch');
const getConfig = require('next/config').default;

// Get server config
const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  }
};

// API credentials
const ROBORABBIT_API_KEY = serverRuntimeConfig.ROBORABBIT_API_KEY;
const TASK_UID = serverRuntimeConfig.TASK_UID;

// Rightmove property URL to test with
const testUrl = 'https://www.rightmove.co.uk/properties/159878753#/?channel=RES_LET';

// Function to validate URL
function isValidUrl(url) {
  try {
    // Check if it's a string first
    if (typeof url !== 'string') {
      return false;
    }

    // Special case for Rightmove media URLs
    if (url.startsWith('https://media.rightmove.co.uk/')) {
      return true;
    }

    // For all other URLs, do standard validation
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// Function to clean Rightmove URL
function cleanRightmoveUrl(url) {
  const propertyId = url.split('/properties/')[1].split(/[#?]/)[0];
  return `https://www.rightmove.co.uk/properties/${propertyId}`;
}

// Function to scrape property data
async function scrapeProperty(url) {
  console.log('Starting scrape for:', url);
  
  try {
    // Clean the URL first
    const cleanedUrl = cleanRightmoveUrl(url);
    console.log('Cleaned URL:', cleanedUrl);
    
    // Create request payload
    const data = {
      "steps": [
        {
          "uid": "w1AE6azd8n7dzxWnYp",
          "action": "go",
          "config": {
            "url": cleanedUrl
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
    
    // First try to get the response as text
    const responseText = await response.text();
    console.log('Raw API Response length:', responseText.length);
    
    if (!response.ok) {
      throw new Error(`Roborabbit API error: ${response.status} - ${responseText}`);
    }
    
    // Try to parse the response as JSON
    let runData;
    try {
      // Check if we have a valid response
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from Roborabbit API');
      }
      
      // Try to parse as JSON
      runData = JSON.parse(responseText);
      
      // If we got a string that looks like JSON, try parsing it again
      if (typeof runData === 'string' && runData.trim().startsWith('{')) {
        runData = JSON.parse(runData);
      }
    } catch (e) {
      console.error('Failed to parse API response:', e);
      // If the response looks like JSON but failed to parse, it might be double-encoded
      try {
        runData = JSON.parse(JSON.parse(responseText));
      } catch (e2) {
        throw new Error(`Invalid JSON response from Roborabbit: ${e.message}. Raw response first 100 chars: ${responseText.substring(0, 100)}`);
      }
    }
    
    console.log('Parsed API Response type:', typeof runData);
    
    if (runData.message) {
      throw new Error(`Error from Roborabbit: ${runData.message}`);
    }
    
    // Poll for results
    if (!runData.uid) {
      throw new Error('No run ID returned from Roborabbit');
    }

    console.log('Starting polling with run ID:', runData.uid);
    const results = await pollForResults(runData.uid);
    
    if (!results) {
      throw new Error('No results returned from polling');
    }
    
    console.log('Processing results...');
    return processResults(results);
  } catch (error) {
    console.error('Error in scrapeProperty:', error);
    throw new Error(`Scraping failed: ${error.message}`);
  }
}

// Function to poll for results
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
    console.log(`Raw polling response length (attempt ${attempts}):`, responseText.length);

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

// Function to process results
function processResults(data) {
  console.log('Processing scraped data...');

  // Get the first output key that contains the structured data
  const outputKeys = Object.keys(data.outputs || {});
  console.log('Available output keys:', outputKeys);

  // Find the key that contains our data
  const outputKey = outputKeys.find(key => key.includes('save_structured_data'));
  
  if (!outputKey) {
    console.error('No structured data found in outputs');
    throw new Error('No valid data found in results');
  }

  console.log('Using output key:', outputKey);
  const propertyData = data.outputs[outputKey];
  
  // Log property images
  if (propertyData.property_images) {
    console.log('Property images found:', {
      count: propertyData.property_images.length,
      isArray: Array.isArray(propertyData.property_images),
      sample: propertyData.property_images[0]
    });
  } else {
    console.error('No property_images found in data');
    throw new Error('No property_images found in data');
  }
  
  return propertyData;
}

// Bannerbear image generation function
async function generateBannerbearImages(propertyData) {
  try {
    console.log('Generating images with property data...');
    console.log('Property data type:', typeof propertyData);
    console.log('Property data keys:', Object.keys(propertyData));
    
    // Validate property_images
    console.log('property_images exists:', 'property_images' in propertyData);
    console.log('property_images type:', typeof propertyData.property_images);
    console.log('property_images is array:', Array.isArray(propertyData.property_images));
    
    if (!propertyData.property_images || !Array.isArray(propertyData.property_images)) {
      console.error('property_images is not a valid array:', propertyData.property_images);
      throw new Error('No valid property images found');
    }
    
    console.log('property_images length:', propertyData.property_images.length);
    
    if (propertyData.property_images.length === 0) {
      console.error('property_images array is empty');
      throw new Error('No valid property images found');
    }

    // Log the first few images
    console.log('First few property images:');
    for (let i = 0; i < Math.min(propertyData.property_images.length, 3); i++) {
      console.log(`Image ${i}:`, propertyData.property_images[i]);
    }

    // Create base modifications for common fields
    const baseModifications = [
      {
        name: "property_price",
        text: propertyData.price || 'Price on application'
      },
      {
        name: "property_location",
        text: propertyData.location_name || 'Location not available'
      },
      {
        name: "bedrooms",
        text: propertyData.bedroom || 'N/A'
      },
      {
        name: "bathrooms",
        text: propertyData.bathrooms || 'N/A'
      },
      {
        name: "estate_agent_address",
        text: propertyData.estate_agent_address || 'Contact agent for details'
      }
    ];

    // Only add logo if it exists
    if (propertyData.estate_agent_logo) {
      baseModifications.push({
        name: "logo",
        image_url: propertyData.estate_agent_logo
      });
    }

    // Add image modifications for each template
    const imageModifications = [];
    for (let i = 0; i <= 23; i++) {
      const layerName = i === 0 ? "property_image" : `property_image${i}`;
      // Use modulo to cycle through available images
      const imageIndex = i % propertyData.property_images.length;
      
      console.log(`Adding image modification for ${layerName}:`, {
        index: imageIndex,
        url: propertyData.property_images[imageIndex]
      });
      
      imageModifications.push({
        name: layerName,
        image_url: propertyData.property_images[imageIndex]
      });
    }

    // Create collection request with all modifications
    const requestData = {
      template_set: serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID,
      modifications: [...baseModifications, ...imageModifications],
      project_id: 'E56OLrMKYWnzwl3oQj',
      webhook_url: serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL,
      webhook_headers: {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
      },
      metadata: {
        source: "rightmove",
        scraped_at: new Date().toISOString(),
        total_images: propertyData.property_images.length
      }
    };

    // Log configuration for debugging
    console.log('Bannerbear request configuration:', {
      template_set: requestData.template_set,
      webhook_url: requestData.webhook_url,
      total_modifications: requestData.modifications.length,
      total_images: propertyData.property_images.length
    });

    // Validate required configuration
    if (!requestData.template_set) {
      throw new Error('BANNERBEAR_TEMPLATE_SET_UID is not configured');
    }

    if (!requestData.webhook_url) {
      throw new Error('BANNERBEAR_WEBHOOK_URL is not configured');
    }

    console.log('Sending request to Bannerbear API...');
    
    // Make the actual API call to Bannerbear
    const response = await fetch('https://api.bannerbear.com/v2/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    const responseText = await response.text();
    console.log('Raw Bannerbear API response:', responseText);

    if (!response.ok) {
      console.error('Bannerbear API error response:', responseText);
      throw new Error(`Bannerbear API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Bannerbear response:', e);
      throw new Error(`Invalid JSON response from Bannerbear: ${responseText}`);
    }

    console.log('Bannerbear API response:', data);

    return {
      uid: data.uid,
      status: 'pending',
      type: 'collection'
    };
  } catch (error) {
    console.error('Error in generateBannerbearImages:', error);
    throw error;
  }
}

// Run the test
async function runIntegrationTest() {
  try {
    console.log('Starting integration test for property:', testUrl);
    
    // Step 1: Scrape the property
    console.log('STEP 1: Scraping property data...');
    const propertyData = await scrapeProperty(testUrl);
    console.log('Scraping complete. Property data keys:', Object.keys(propertyData));
    
    // Step 2: Generate Bannerbear images
    console.log('STEP 2: Generating Bannerbear images...');
    const result = await generateBannerbearImages(propertyData);
    console.log('Integration test successful!', result);
  } catch (error) {
    console.error('Integration test failed:', error);
  }
}

runIntegrationTest(); 