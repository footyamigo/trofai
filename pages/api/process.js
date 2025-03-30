// Import AWS SDK
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const getConfig = require('next/config').default;

// Get server config
const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  }
};

// Configure AWS
AWS.config.update({
  accessKeyId: serverRuntimeConfig.AWS_ACCESS_KEY_ID,
  secretAccessKey: serverRuntimeConfig.AWS_SECRET_ACCESS_KEY,
  region: serverRuntimeConfig.AWS_REGION || 'eu-west-2'
});

// Initialize DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Roborabbit scraping constants
const ROBORABBIT_API_KEY = serverRuntimeConfig.ROBORABBIT_API_KEY;
const TASK_UID = serverRuntimeConfig.TASK_UID;

// Bannerbear constants
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY;
const BANNERBEAR_TEMPLATE_UID = serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID;

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
    
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`Roborabbit API error: ${response.status} - ${responseText}`);
    }
    
    let runData;
    try {
      runData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error(`Invalid JSON response from Roborabbit: ${responseText}`);
    }
    
    console.log('Parsed API Response:', runData);
    
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
    
    console.log('Processing results:', results);
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
      console.log(`Raw polling response (attempt ${attempts}):`, responseText);

      if (!response.ok) {
        throw new Error(`Failed to poll results: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse polling response:', e);
        throw new Error(`Invalid JSON in polling response: ${responseText}`);
      }

      console.log(`Poll response data (attempt ${attempts}):`, data);

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

// Function to process results
async function processResults(data) {
  console.log('Processing raw data:', JSON.stringify(data, null, 2));

  // Get the first output key that contains the structured data
  const outputKey = Object.keys(data.outputs || {}).find(key => key.endsWith('_save_structured_data'));
  
  if (!outputKey || !data.outputs[outputKey]) {
    console.error('No structured data found in outputs:', data.outputs);
    throw new Error('No valid data found in results');
  }

  const propertyData = data.outputs[outputKey];
  
  // Validate essential fields
  if (!propertyData) {
    throw new Error('Property data is undefined');
  }
  
  // Check if required fields exist
  if (!propertyData.location_name) {
    console.warn('Missing location_name in property data');
    propertyData.location_name = 'Location not available';
  }
  
  if (!propertyData.estate_agent_address) {
    console.warn('Missing estate_agent_address in property data');
    propertyData.estate_agent_address = 'Agent address not available';
  }
  
  if (!propertyData.property_images || !propertyData.property_images.length) {
    console.warn('Missing property images in property data');
    propertyData.property_images = ['/images/placeholder.jpg'];
  }
  
  // Return the validated property data
  return propertyData;
}

// Bannerbear Functions
async function generateBannerbearImages(propertyData) {
  console.log('Generating Bannerbear images for:', propertyData);

  try {
    // Create collection request with raw data
    const requestData = {
      template_set: process.env.BANNERBEAR_TEMPLATE_SET_UID,
      modifications: [
        {
          name: "property_image",
          image_url: propertyData.property_images[0]
        },
        {
          name: "property_price",
          text: propertyData.price
        },
        {
          name: "property_location",
          text: propertyData.location_name
        },
        {
          name: "bedrooms",
          text: propertyData.bedroom
        },
        {
          name: "bathrooms",
          text: propertyData.bathrooms
        },
        {
          name: "estate_agent_address",
          text: propertyData.estate_agent_address
        },
        {
          name: "logo",
          image_url: propertyData.estate_agent_logo
        }
      ],
      webhook_url: process.env.BANNERBEAR_WEBHOOK_URL,
      project_id: 'E56OLrMKYWnzwl3oQj',
      metadata: {
        source: "rightmove",
        scraped_at: new Date().toISOString()
      }
    };

    // Add image_urls_by_template to specify different images for each template
    if (propertyData.property_images.length > 1) {
      requestData.image_urls_by_template = {};
      propertyData.property_images.forEach((imageUrl, index) => {
        requestData.image_urls_by_template[`property_image_${index + 1}`] = imageUrl;
      });
    }

    console.log('Bannerbear request data:', JSON.stringify(requestData, null, 2));

    const response = await fetch('https://api.bannerbear.com/v2/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BANNERBEAR_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bannerbear API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Bannerbear API response:', data);

    return {
      uid: data.uid,
      status: 'pending',
      type: 'collection'
    };
  } catch (error) {
    console.error('Error generating Bannerbear images:', error);
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
    BANNERBEAR_TEMPLATE_UID: BANNERBEAR_TEMPLATE_UID ? '✓ Set' : '✗ Missing'
  });

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'Property URL is required' });
    }

    console.log('Starting process with URL:', url);

    // Scrape property data
    const propertyData = await scrapeProperty(url);
    console.log('Scraped property data:', JSON.stringify(propertyData, null, 2));

    // Generate caption
    const caption = generateCaption(propertyData);
    console.log('Generated caption:', caption);

    // Generate Bannerbear images
    const imageResult = await generateBannerbearImages(propertyData);
    console.log('Bannerbear image generation initiated:', imageResult);

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
    return res.status(500).json({ 
      message: 'Error processing request', 
      error: error.message,
      details: error.stack
    });
  }
} 