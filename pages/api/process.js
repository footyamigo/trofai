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
  if (!data?.outputs?.QD5MJYBw2JgnylL3x6_save_structured_data) {
    throw new Error('No valid data found in results');
  }

  const propertyData = data.outputs.QD5MJYBw2JgnylL3x6_save_structured_data;
  
  // Format the data
  const formattedData = {
    property: {
      address: propertyData.location_name,
      price: propertyData.price,
      bedrooms: propertyData.bedroom,
      bathrooms: propertyData.bathrooms,
      mainImage: propertyData.property_images?.[0],
      allImages: propertyData.property_images || [],
      keyFeatures: propertyData.key_features,
      description: propertyData.listing_description
    },
    agent: {
      name: propertyData.estate_agent_name,
      address: propertyData.estate_agent_address,
      logo: propertyData.estate_agent_logo,
      about: propertyData.estate_agent_about
    }
  };

  // Generate caption
  const caption = generateCaption(formattedData);

  // Create Bannerbear-ready structure
  const bannerbearData = {
    template: BANNERBEAR_TEMPLATE_UID,
    modifications: [
      {
        name: 'property_image',
        image_url: formattedData.property.mainImage
      },
      {
        name: 'property_price',
        text: formattedData.property.price
      },
      {
        name: 'property_location',
        text: formattedData.property.address
      },
      {
        name: 'bedrooms',
        text: formattedData.property.bedrooms
      },
      {
        name: 'bathrooms',
        text: formattedData.property.bathrooms
      },
      {
        name: 'logo',
        image_url: formattedData.agent.logo
      },
      {
        name: 'estate_agent_address',
        text: formattedData.agent.address
      }
    ],
    transparent: false,
    render_pdf: false,
    metadata: {
      source: "rightmove",
      scraped_at: new Date().toISOString()
    }
  };

  return {
    raw: formattedData,
    bannerbear: bannerbearData,
    caption: caption
  };
}

// Function to generate caption
function generateCaption(data) {
  console.log('Generating caption...');
  
  const property = data.property;
  const agent = data.agent;
  
  // Handle missing or undefined values
  const address = property.address || 'Property';
  const firstPart = address.split(',')[0] || 'Property';
  const bedrooms = property.bedrooms || 'multiple';
  const bathrooms = property.bathrooms || 'multiple';
  const keyFeatures = property.keyFeatures 
    ? property.keyFeatures.split(/\s*\n\s*/).join('. ') 
    : 'Fantastic property with great features';
  const description = property.description 
    ? property.description.substring(0, 150) + '...'
    : 'This property offers excellent value and is located in a prime area.';
  const agentName = agent.name || 'the agent';
  
  // Generate hashtag from address
  const locationTag = firstPart.replace(/\s+/g, '');
  
  // Sample caption template for property
  return `✨ **Your New Home Awaits in ${firstPart}!** ✨

This stunning ${bedrooms} bedroom property offers modern living at its finest with ${bathrooms} bathroom${bathrooms > 1 && bathrooms !== 'multiple' ? 's' : ''}. ${keyFeatures}. 

Located in ${address}, you'll enjoy easy access to local amenities and excellent transportation links. ${description}

Contact ${agentName} today to arrange a viewing!

#PropertyListing #DreamHome #${locationTag} #RealEstate`;
}

// Bannerbear Functions
async function generateBannerbearImage(propertyData) {
  console.log('Starting Bannerbear image generation...');
  
  try {
    const imagePayload = {
      ...propertyData.bannerbear,
      project_id: 'E56OLrMKYWnzwl3oQj'
    };

    if (process.env.BANNERBEAR_WEBHOOK_URL) {
      imagePayload.webhook_url = process.env.BANNERBEAR_WEBHOOK_URL;
      imagePayload.webhook_headers = {
        'Authorization': `Bearer ${process.env.BANNERBEAR_WEBHOOK_SECRET}`
      };
    }

    console.log('Sending Bannerbear image request:', JSON.stringify(imagePayload, null, 2));

    const response = await fetch('https://api.bannerbear.com/v2/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imagePayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Bannerbear API Error:', error);
      throw new Error(`Bannerbear API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Image generation initiated:', result);

    return {
      type: 'single',
      uid: result.uid,
      status: result.status,
      webhook_url: imagePayload.webhook_url
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

async function generateBannerbearCollection(propertyData, templateSetUid) {
  try {
    // Get all available property images
    const propertyImages = propertyData.raw.property.allImages;
    
    // Create modifications array with base data (everything except property image)
    const baseModifications = [
      {
        name: 'property_price',
        text: propertyData.raw.property.price
      },
      {
        name: 'property_location',
        text: propertyData.raw.property.address
      },
      {
        name: 'bedrooms',
        text: propertyData.raw.property.bedrooms
      },
      {
        name: 'bathrooms',
        text: propertyData.raw.property.bathrooms
      },
      {
        name: 'logo',
        image_url: propertyData.raw.agent.logo
      },
      {
        name: 'estate_agent_address',
        text: propertyData.raw.agent.address
      }
    ];

    // Create the collection payload
    const collectionPayload = {
      template_set: templateSetUid,
      modifications: [
        {
          name: 'property_image',
          image_url: propertyImages[0] // First image will be used if we run out of images
        },
        ...baseModifications
      ],
      project_id: 'E56OLrMKYWnzwl3oQj',
      metadata: {
        source: "rightmove",
        scraped_at: new Date().toISOString(),
        property_id: propertyData.raw.property.id,
        total_images: propertyImages.length
      }
    };

    // Add image_urls_by_template to specify different images for each template
    if (propertyImages.length > 1) {
      collectionPayload.image_urls_by_template = {};
      propertyImages.forEach((imageUrl, index) => {
        collectionPayload.image_urls_by_template[`property_image_${index + 1}`] = imageUrl;
      });
    }

    if (process.env.BANNERBEAR_WEBHOOK_URL) {
      collectionPayload.webhook_url = process.env.BANNERBEAR_WEBHOOK_URL;
      collectionPayload.webhook_headers = {
        'Authorization': `Bearer ${process.env.BANNERBEAR_WEBHOOK_SECRET}`
      };
    }

    console.log('Sending Bannerbear collection request:', JSON.stringify(collectionPayload, null, 2));

    const response = await fetch('https://api.bannerbear.com/v2/collections', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(collectionPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Bannerbear Collection API Error:', error);
      throw new Error(`Bannerbear Collection API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Collection generation initiated:', result);

    return {
      type: 'collection',
      uid: result.uid,
      status: result.status,
      webhook_url: collectionPayload.webhook_url,
      template_set: templateSetUid,
      total_images: propertyImages.length
    };
  } catch (error) {
    console.error('Error generating collection:', error);
    throw error;
  }
}

async function pollBannerbearImage(uid) {
  const MAX_ATTEMPTS = 30;
  const POLL_INTERVAL = 2000;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    console.log(`Polling Bannerbear image status (attempt ${attempts + 1}/${MAX_ATTEMPTS})...`);
    
    try {
      const response = await fetch(`https://api.bannerbear.com/v2/images/${uid}?project_id=E56OLrMKYWnzwl3oQj`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Bannerbear polling error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status !== 400 || attempts >= MAX_ATTEMPTS - 1) {
          throw new Error(`Failed to poll Bannerbear: ${response.status} - ${response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('Polling response:', result);

      if (result.status === 'completed') {
        console.log('Image generation completed!');
        return {
          status: 'completed',
          image_url: result.image_url,
          image_url_png: result.image_url_png,
          image_url_jpg: result.image_url_jpg
        };
      } else if (result.status === 'failed') {
        throw new Error('Image generation failed: ' + JSON.stringify(result));
      }

      console.log(`Image status: ${result.status}, waiting ${POLL_INTERVAL}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      attempts++;
    } catch (error) {
      if (attempts < MAX_ATTEMPTS - 1) {
        console.log(`Error polling, retrying in ${POLL_INTERVAL}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error('Bannerbear image generation timed out');
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
    console.log('Processing URL:', url);

    const propertyData = await scrapeProperty(url);
    
    // Generate Bannerbear images using template set
    const templateSetUid = process.env.BANNERBEAR_TEMPLATE_SET_UID;
    let bannerbearResponse;

    if (!templateSetUid) {
      console.log('No template set configured, falling back to single template...');
      bannerbearResponse = await generateBannerbearImage(propertyData);
    } else {
      console.log('Generating collection using template set:', templateSetUid);
      bannerbearResponse = await generateBannerbearCollection(propertyData, templateSetUid);
    }

    return res.status(200).json({
      success: true,
      data: {
        property: propertyData.raw,
        caption: propertyData.caption,
        bannerbear: bannerbearResponse
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
} 