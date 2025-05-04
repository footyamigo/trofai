// firecrawl-onthemarket-scraper.cjs - CommonJS version for video workflow
const { z } = require('zod');
const fetch = require('node-fetch');
const getConfig = require('next/config').default;
const { generatePropertyCaptions, CAPTION_TYPES } = require('./caption-generator');

const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  }
};

const schema = z.object({
  property: z.object({
    address: z.string(),
    price: z.string(),
    bedrooms: z.number(),
    bathrooms: z.number(),
    square_ft: z.number().nullable(),
    description: z.string(),
    images: z.array(z.string()),
    key_features: z.array(z.string()).optional(),
  }),
  estate_agent: z.object({
    name: z.string(),
    address: z.string(),
    logo: z.string(),
  })
});

function formatOnTheMarketData(data) {
  // Normalize the structure for caption generation
  return {
    property: {
      address: data.property.address,
      price: data.property.price,
      bedrooms: data.property.bedrooms,
      bathrooms: data.property.bathrooms,
      square_ft: data.property.square_ft,
      keyFeatures: data.property.key_features || data.property.keyFeatures || [],
      description: data.property.description,
      allImages: data.property.images || [],
    },
    agent: {
      name: data.estate_agent.name,
      address: data.estate_agent.address,
      logo: data.estate_agent.logo,
      about: ''
    }
  };
}

async function processOnTheMarketResult(extractResult, listingType, agentProfile = null) {
  if (!extractResult || !extractResult.success || !extractResult.data) {
    return {
      raw: {},
      bannerbear: { metadata: { source: 'onthemarket' } },
      caption: '',
      error: extractResult?.error || 'Failed to extract property data'
    };
  }
  // Generate caption using the same logic, passing listingType and agentProfile
  const formattedData = formatOnTheMarketData(extractResult.data);
  let caption = '';
  try {
    caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM, agentProfile, listingType);
    if (!caption) {
      caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
    }
  } catch (error) {
    caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
  }
  return {
    raw: extractResult.data,
    bannerbear: { metadata: { source: 'onthemarket' } },
    caption,
  };
}

async function pollFirecrawlResults(extractId) {
  let attempts = 0;
  const maxAttempts = 30;
  const interval = 3000;
  while (attempts < maxAttempts) {
    attempts++;
    const response = await fetch(`https://api.firecrawl.dev/v1/extract/${extractId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
      }
    });
    const data = await response.json();
    if (data.status === 'completed' && data.data) {
      return data;
    } else if (data.status === 'failed') {
      throw new Error('Firecrawl extraction failed: ' + JSON.stringify(data));
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Max polling attempts reached');
}

async function scrapeOnTheMarketProperty(propertyUrl, listingType, agentProfile = null) {
  // Use fetch to call Firecrawl HTTP API
  const prompt = `Extract the property address, price (if rental, only the pcm value), number of bedrooms, number of bathrooms, square footage, description, all gallery images, key features, estate agent name, estate agent address, and estate agent logo image.\n\nReturn the result in this schema: { property: { address, price, bedrooms, bathrooms, square_ft, description, images, key_features }, estate_agent: { name, address, logo } }`;
  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      urls: [propertyUrl],
      prompt,
    })
  });
  const extractData = await response.json();
  if (!extractData.success) {
    throw new Error(`Error from Firecrawl: ${extractData.message || 'Unknown error'}`);
  }
  let result;
  if (extractData.data && extractData.data.length > 0) {
    result = await processOnTheMarketResult(extractData, listingType, agentProfile);
  } else if (extractData.id) {
    // Poll for results
    const pollResult = await pollFirecrawlResults(extractData.id);
    result = await processOnTheMarketResult(pollResult, listingType, agentProfile);
  } else {
    throw new Error('Unexpected response format from Firecrawl');
  }
  // Add logging for debugging
  if (result && result.raw && result.raw.images) {
    console.log('[OnTheMarket Scraper] Images:', JSON.stringify(result.raw.images, null, 2));
  }
  if (result && result.raw) {
    console.log('[OnTheMarket Scraper] Raw property data:', JSON.stringify(result.raw, null, 2));
    // Set mainImage to the first image if available
    if (result.raw.property && Array.isArray(result.raw.property.images) && result.raw.property.images.length > 0) {
      result.raw.property.mainImage = result.raw.property.images[0];
    }
    // Ensure price is always a formatted string
    if (result.raw.property && typeof result.raw.property.price === 'number') {
      result.raw.property.price = '£' + result.raw.property.price.toLocaleString();
    }
  }
  return result;
}

function formatSquareFt(sqft) {
    if (!sqft) return "";
    if (typeof sqft === 'string' && sqft.toLowerCase().includes('sq ft')) {
        return sqft;
    }
    const numericValue = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, ''), 10) : sqft;
    if (isNaN(numericValue) || numericValue <= 0) {
        return "";
    }
    const formattedValue = numericValue.toLocaleString();
    return `${formattedValue} sq ft`;
}

module.exports = {
  scrapeOnTheMarketProperty,
  formatSquareFt
}; 