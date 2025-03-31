// Import AWS SDK
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const getConfig = require('next/config').default;

// Get server config with clear fallbacks
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

// Extract all API keys and config with fallbacks
const ROBORABBIT_API_KEY = serverRuntimeConfig.ROBORABBIT_API_KEY || process.env.ROBORABBIT_API_KEY;
const TASK_UID = serverRuntimeConfig.TASK_UID || process.env.TASK_UID;
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;
const BANNERBEAR_TEMPLATE_UID = serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID || process.env.BANNERBEAR_TEMPLATE_UID;
const BANNERBEAR_TEMPLATE_SET_UID = serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID || process.env.BANNERBEAR_TEMPLATE_SET_UID;
const BANNERBEAR_WEBHOOK_URL = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL || process.env.BANNERBEAR_WEBHOOK_URL;
const BANNERBEAR_WEBHOOK_SECRET = serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET || process.env.BANNERBEAR_WEBHOOK_SECRET;
const AWS_ACCESS_KEY_ID = serverRuntimeConfig.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = serverRuntimeConfig.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const AWS_REGION = serverRuntimeConfig.AWS_REGION || process.env.REGION || 'us-east-1';

// Configure AWS with better error handling
let dynamoDb;
try {
  AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION
  });
  
  // Initialize DynamoDB DocumentClient
  dynamoDb = new AWS.DynamoDB.DocumentClient();
  console.log('DynamoDB configured successfully');
} catch (error) {
  console.error('Failed to configure AWS:', error);
  // Continue without DynamoDB functionality
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
    console.log('Using Roborabbit API key:', ROBORABBIT_API_KEY ? 'Set (not shown)' : 'Not set');
    console.log('Using Task UID:', TASK_UID);
    
    // Call Roborabbit API with better error handling
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
    console.log('Raw API Response length:', responseText.length, 'First 100 chars:', responseText.substring(0, 100));
    
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
  const MAX_POLLING_ATTEMPTS = 60;
  const POLLING_INTERVAL_MS = 2000;
  let attempts = 0;

  const poll = async () => {
    if (attempts >= MAX_POLLING_ATTEMPTS) {
      throw new Error('Max polling attempts reached');
    }

    attempts++;
    console.log(`Polling attempt ${attempts}...`);

    try {
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

      // Check for empty response
      if (!responseText || responseText.trim() === '') {
        console.warn(`Empty response received in polling attempt ${attempts}`);
        
        // If we're still early in polling attempts, let's wait and try again
        if (attempts < MAX_POLLING_ATTEMPTS / 2) {
          console.log(`Waiting ${POLLING_INTERVAL_MS * 2}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS * 2));
          return poll();
        } else {
          throw new Error('Received empty responses too many times while polling');
        }
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse polling response:', e);
        throw new Error(`Invalid JSON in polling response: ${e.message}. Raw response: ${responseText.substring(0, 100)}`);
      }

      console.log(`Poll status (attempt ${attempts}):`, data.status);

      if (data.status === 'finished' && data.outputs) {
        console.log('Scraping completed successfully!');
        return data;
      } else if (data.status === 'failed') {
        const errorMessage = data.error || data.message || 'Unknown error';
        console.error('Scraping failed:', errorMessage);
        throw new Error(`Scraping failed: ${errorMessage}`);
      } else if (!['running', 'pending'].includes(data.status)) {
        throw new Error(`Unexpected status: ${data.status}`);
      }

      // If still pending, wait and try again
      console.log(`Status: ${data.status}, waiting ${POLLING_INTERVAL_MS}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      return poll();
    } catch (error) {
      console.error(`Error in polling attempt ${attempts}:`, error);
      throw error;
    }
  };

  return await poll();
}

// Function to format address
function formatAddress(address) {
  if (!address) return null;
  
  // Remove extra whitespace, normalize line endings, and fix multiple commas
  return address
    .replace(/\r\n/g, ',')
    .replace(/,+/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

// Function to format price
function formatPrice(price) {
  if (!price) return null;
  
  // Remove any existing currency symbols and commas
  const cleanPrice = price.replace(/[£,]/g, '').trim();
  
  // Extract numeric value and period (pcm, pw)
  const matches = cleanPrice.match(/^(\d+(?:\.\d+)?)\s*(pcm|pw)?$/i);
  if (!matches) return price; // Return original if format not recognized

  const [_, amount, period] = matches;
  const numericAmount = parseFloat(amount);

  // Format with currency symbol and commas, but without decimals
  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericAmount);

  return `${formattedAmount} ${period || ''}`.trim();
}

// Function to process results
function processResults(data) {
  try {
    console.log('Processing scraped data...');
    
    // Get the first output key that contains the structured data
    const outputKeys = Object.keys(data.outputs || {});
    console.log('Available output keys:', outputKeys);

    // Find the key that contains our data
    const outputKey = outputKeys.find(key => key.includes('save_structured_data'));
    
    if (!outputKey) {
      console.error('No structured data found in outputs:', data.outputs);
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
    }
    
    return propertyData;
  } catch (error) {
    console.error('Error processing results:', error);
    throw new Error(`Failed to process property data: ${error.message}`);
  }
}

// Function to validate URL
function isValidUrl(url) {
  try {
    // Check if it's a string first
    if (typeof url !== 'string') {
      console.log('URL validation failed: Not a string');
      return false;
    }

    // Special case for Rightmove media URLs
    if (url.includes('media.rightmove.co.uk')) {
      console.log('URL validation passed: Rightmove media URL');
      return true;
    }

    // For all other URLs, do standard validation
    const parsedUrl = new URL(url);
    const isValid = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    console.log(`URL validation ${isValid ? 'passed' : 'failed'}: ${url}`);
    return isValid;
  } catch (error) {
    console.log(`URL validation error: ${error.message} for URL: ${url}`);
    return false;
  }
}

// Bannerbear Functions - Matching integration-test.js approach
async function generateBannerbearImages(propertyData) {
  try {
    console.log('Generating Bannerbear images...');
    console.log('Property data type:', typeof propertyData);
    console.log('Property data keys:', Object.keys(propertyData));
    
    // Validate property_images with better logging
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

    // Only add logo if it exists and is valid
    if (propertyData.estate_agent_logo && isValidUrl(propertyData.estate_agent_logo)) {
      baseModifications.push({
        name: "logo",
        image_url: propertyData.estate_agent_logo
      });
    }

    // Add image modifications for each template - Using exact same approach as integration-test.js
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
      template_set: BANNERBEAR_TEMPLATE_SET_UID,
      modifications: [...baseModifications, ...imageModifications],
      project_id: 'E56OLrMKYWnzwl3oQj',
      webhook_url: BANNERBEAR_WEBHOOK_URL,
      webhook_headers: {
        'Authorization': `Bearer ${BANNERBEAR_WEBHOOK_SECRET}`
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
    const response = await fetch('https://api.bannerbear.com/v2/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    const responseText = await response.text();
    console.log('Raw Bannerbear API response length:', responseText.length, 'First 100 chars:', responseText.substring(0, 100));

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

// Function to generate caption
function generateCaption(propertyData) {
  console.log('Generating caption...');
  
  // Extract location parts
  const location = propertyData.location_name || 'Property';
  const firstPart = location.split(',')[0] || 'Property';
  
  // Get property details
  const bedrooms = propertyData.bedroom || 'multiple';
  const bathrooms = propertyData.bathrooms || 'multiple';
  const price = propertyData.price || 'Price on application';
  const agentName = propertyData.estate_agent_name || 'us';
  
  // Clean up key features
  const keyFeatures = propertyData.key_features || 'Fantastic property with great features';
  
  // Get description
  const description = propertyData.listing_description 
    ? propertyData.listing_description.substring(0, 150) + '...'
    : 'This property offers excellent value and is located in a prime area.';
  
  // Generate hashtag from location
  const locationTag = firstPart.replace(/\s+/g, '');
  
  // Generate caption
  return `✨ **Your New Home Awaits in ${firstPart}!** ✨

This stunning ${bedrooms} bedroom property offers modern living at its finest with ${bathrooms} bathroom${bathrooms > 1 && bathrooms !== 'multiple' ? 's' : ''}. ${keyFeatures}

Located in ${location}, you'll enjoy easy access to local amenities and excellent transportation links. ${description}

Contact ${agentName} today to arrange a viewing!

#PropertyListing #DreamHome #${locationTag} #RealEstate`;
}

// Main API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Log environment variables (without exposing full keys)
  console.log('Environment check:', {
    ROBORABBIT_API_KEY: ROBORABBIT_API_KEY ? '✓ Set' : '✗ Missing',
    TASK_UID: TASK_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_API_KEY: BANNERBEAR_API_KEY ? '✓ Set' : '✗ Missing',
    BANNERBEAR_TEMPLATE_UID: BANNERBEAR_TEMPLATE_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_TEMPLATE_SET_UID: BANNERBEAR_TEMPLATE_SET_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_WEBHOOK_URL: BANNERBEAR_WEBHOOK_URL ? '✓ Set' : '✗ Missing',
    BANNERBEAR_WEBHOOK_SECRET: BANNERBEAR_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing',
    AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing',
    AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing',
    AWS_REGION: AWS_REGION
  });

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Property URL is required' });
    }

    console.log('Starting process with URL:', url);

    // Scrape property data
    let propertyData;
    try {
      propertyData = await scrapeProperty(url);
      console.log('Scraped property data:', {
        location: propertyData.location_name,
        price: propertyData.price,
        images: propertyData.property_images?.length || 0
      });
    } catch (error) {
      console.error('Error scraping property:', error);
      return res.status(500).json({
        message: 'Error scraping property data',
        error: error.message,
        details: error.stack,
        code: 'SCRAPING_ERROR'
      });
    }
    
    // Validate that we have the minimum required data
    if (!propertyData || typeof propertyData !== 'object') {
      return res.status(500).json({
        message: 'Invalid property data format returned from scraper',
        error: 'Property data is not an object',
        code: 'INVALID_DATA_FORMAT'
      });
    }

    // Generate caption
    let caption;
    try {
      caption = generateCaption(propertyData);
      console.log('Generated caption length:', caption.length);
    } catch (error) {
      console.error('Error generating caption:', error);
      caption = "✨ **Property Details** ✨\n\nView this property on Rightmove for more information!"; // Fallback caption
    }

    // Generate Bannerbear images
    let imageResult;
    try {
      imageResult = await generateBannerbearImages(propertyData);
      console.log('Bannerbear image generation initiated:', imageResult);
    } catch (error) {
      console.error('Error generating Bannerbear images:', error);
      return res.status(500).json({
        message: 'Error generating images',
        error: error.message,
        details: error.stack,
        code: 'BANNERBEAR_ERROR'
      });
    }

    // Structure the response in the expected format
    return res.status(200).json({
      message: 'Processing started',
      data: {
        bannerbear: {
          uid: imageResult.uid,
          status: imageResult.status,
          type: imageResult.type || 'collection'
        },
        caption: caption,
        property: {
          address: propertyData.location_name || 'Address not available',
          price: propertyData.price || 'Price not available',
          bedrooms: propertyData.bedroom || 'N/A',
          bathrooms: propertyData.bathrooms || 'N/A',
          images: propertyData.property_images || []
        }
      }
    });
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Detect JSON parse errors specifically
    const isJsonError = error.message && error.message.includes('JSON');
    
    return res.status(500).json({ 
      message: isJsonError ? 'Error parsing data from external API' : 'Error processing request', 
      error: error.message,
      details: error.stack,
      code: isJsonError ? 'JSON_PARSE_ERROR' : 'GENERAL_ERROR'
    });
  }
} 