// Direct test of the generate images function
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

// Create a valid mock property data
const mockPropertyData = {
  location_name: "Icon Tower, One West Point, Portal Way, London, W3",
  estate_agent_name: "AWOL, One West Point",
  estate_agent_address: "4 Victoria Road, Acton, W3 6FG",
  bedroom: "1",
  price: "£2,050 pcm",
  location: "Icon Tower, One West Point, Portal Way, London, W3",
  estate_agent_logo: "https://media.rightmove.co.uk/239k/238379/branch_logo_238379_0001.jpeg",
  bathrooms: "1",
  key_features: "One bedroom apartment\nAvailable now\n9th floor\nPet friendly\nApprox: 541 sq/ft\nFully furnished\nPrivate balcony\n24hr concierge & Residents gym\nDog grooming & Training room\nCo-working spaces\nFridge/freezer, oven/hob, dishwasher & washer/dryer\nLow deposit option available",
  listing_description: "Experience luxury living at its finest in this beautifully designed one bedroom apartment on the 9th floor of Icon Tower with West facing views.",
  estate_agent_about: "About AWOL, One West Point4 Victoria Road, Acton, W3 6FG\nView our properties to rent\nFind out more about us\nView different offices from this agent",
  // Sample image URLs that should work
  property_images: [
    "https://media.rightmove.co.uk/239k/238379/159878753/238379_A0907E_IMG_00_0000.jpeg",
    "https://media.rightmove.co.uk/239k/238379/159878753/238379_A0907E_IMG_01_0000.jpeg",
    "https://media.rightmove.co.uk/239k/238379/159878753/238379_A0907E_IMG_02_0000.jpeg",
    "https://media.rightmove.co.uk/239k/238379/159878753/238379_A0907E_IMG_03_0000.jpeg",
    "https://media.rightmove.co.uk/239k/238379/159878753/238379_A0907E_IMG_04_0000.jpeg"
  ]
};

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

// Simplified generate images function
async function generateBannerbearImages(propertyData) {
  try {
    console.log('Generating images with property data...');
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
async function runTest() {
  try {
    console.log('Starting direct test with mock property data');
    
    // Validate the URLs in the mock data
    console.log('Validating mock image URLs:');
    mockPropertyData.property_images.forEach((url, index) => {
      console.log(`URL ${index} valid:`, isValidUrl(url));
    });
    
    const result = await generateBannerbearImages(mockPropertyData);
    console.log('Test successful!', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 