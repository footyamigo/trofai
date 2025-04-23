const FireCrawlApp = require('@mendable/firecrawl-js').default || require('@mendable/firecrawl-js');
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

const app = new FireCrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || "fc-2d3cdb3b94e14edabd5825271079994b" });

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

function formatZooplaData(data) {
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

async function processZooplaResult(extractResult) {
  if (!extractResult || !extractResult.success || !extractResult.data) {
    return {
      raw: {},
      bannerbear: { metadata: { source: 'zoopla' } },
      caption: '',
      error: extractResult?.error || 'Failed to extract property data'
    };
  }
  const formattedData = formatZooplaData(extractResult.data);
  let caption = '';
  try {
    caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM);
    if (!caption) {
      caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
    }
  } catch (error) {
    caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
  }
  return {
    raw: extractResult.data,
    bannerbear: { metadata: { source: 'zoopla' } },
    caption,
  };
}

async function scrapeZooplaProperty(propertyUrl) {
  const extractResult = await app.extract([
    propertyUrl
  ], {
    prompt: `Extract the property address, price (if rental, only the pcm value), number of bedrooms, number of bathrooms, square footage, description, all gallery images, key features, estate agent name, estate agent address, and estate agent logo image.\n\nReturn the result in this schema: { property: { address, price, bedrooms, bathrooms, square_ft, description, images, key_features }, estate_agent: { name, address, logo } }`,
    schema,
  });
  return processZooplaResult(extractResult);
}

async function generateBannerbearImage(propertyData) {
  try {
    const bannerbearPayload = {
      ...propertyData.bannerbear,
      project_id: 'E56OLrMKYWnzwl3oQj'
    };
    if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
      bannerbearPayload.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
      bannerbearPayload.webhook_headers = {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
      };
    }
    const response = await fetch('https://api.bannerbear.com/v2/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bannerbearPayload)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bannerbear API error: ${response.status} - ${response.statusText}`);
    }
    const result = await response.json();
    return {
      uid: result.uid,
      status: result.status,
      webhook_url: bannerbearPayload.webhook_url
    };
  } catch (error) {
    throw error;
  }
}

async function generateBannerbearCollection(propertyData, templateSetUid) {
  try {
    const property = propertyData.raw.property;
    const agent = propertyData.raw.estate_agent;
    const propertyImages = property.images || property.gallery_images || [];
    const baseModifications = [
      { name: "property_price", text: property.price },
      { name: "property_location", text: property.address },
      { name: "bedrooms", text: property.bedrooms },
      { name: "bathrooms", text: property.bathrooms },
      { name: "logo", image_url: agent.logo },
      { name: "estate_agent_address", text: agent.address },
      { name: 'sq_ft', text: formatSquareFt(property.square_ft) }
    ];
    const imageModifications = [];
    for (let i = 0; i <= 23; i++) {
      const layerName = i === 0 ? "property_image" : `property_image${i}`;
      const imageIndex = i < propertyImages.length ? i : i % propertyImages.length;
      imageModifications.push({
        name: layerName,
        image_url: propertyImages[imageIndex]
      });
    }
    const collectionPayload = {
      template_set: templateSetUid,
      modifications: [...baseModifications, ...imageModifications],
      project_id: 'E56OLrMKYWnzwl3oQj',
      metadata: {
        source: "zoopla",
        scraped_at: new Date().toISOString(),
        propertyId: property.id || property.address,
        total_images: propertyImages.length
      }
    };
    if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
      collectionPayload.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
      collectionPayload.webhook_headers = {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
      };
    }
    const response = await fetch('https://api.bannerbear.com/v2/collections', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(collectionPayload)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bannerbear Collection API error: ${response.status} - ${response.statusText}`);
    }
    const result = await response.json();
    return {
      uid: result.uid,
      status: result.status,
      webhook_url: collectionPayload.webhook_url,
      template_set: templateSetUid
    };
  } catch (error) {
    throw error;
  }
}

// Add utility function to format square footage
function formatSquareFt(sqft) {
    if (!sqft) return "";
    
    // If already formatted with sq ft, return as is
    if (typeof sqft === 'string' && sqft.toLowerCase().includes('sq ft')) {
        return sqft;
    }
    
    // Convert to number if it's a string
    const numericValue = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, ''), 10) : sqft;
    
    // If not a valid number, return empty string
    if (isNaN(numericValue) || numericValue <= 0) {
        return "";
    }
    
    // Format the number with commas for thousands if needed
    const formattedValue = numericValue.toLocaleString();
    
    // Return with sq ft appended
    return `${formattedValue} sq ft`;
}

module.exports = {
  scrapeZooplaProperty,
  generateBannerbearImage,
  generateBannerbearCollection,
  default: scrapeZooplaProperty
}; 