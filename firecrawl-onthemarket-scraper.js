import FireCrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
const fetch = require('node-fetch');
const getConfig = require('next/config').default;
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

const { generatePropertyCaptions, CAPTION_TYPES } = require('./caption-generator');

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

async function processOnTheMarketResult(extractResult, agentProfile = null) {
  if (!extractResult || !extractResult.success || !extractResult.data) {
    return {
      raw: {},
      bannerbear: { metadata: { source: 'onthemarket' } },
      caption: '',
      error: extractResult?.error || 'Failed to extract property data'
    };
  }
  // Generate caption using the same logic as Rightmove, passing agentProfile
  const formattedData = formatOnTheMarketData(extractResult.data);
  let caption = '';
  try {
    caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM, agentProfile);
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

async function scrapeOnTheMarketProperty(propertyUrl, agentProfile = null) {
  const extractResult = await app.extract([
    propertyUrl
  ], {
    prompt: `Extract the property address, price (if rental, only the pcm value), number of bedrooms, number of bathrooms, square footage, description, all gallery images, key features, estate agent name, estate agent address, and estate agent logo image.\n\nReturn the result in this schema: { property: { address, price, bedrooms, bathrooms, square_ft, description, images, key_features }, estate_agent: { name, address, logo } }`,
    schema,
  });
  return processOnTheMarketResult(extractResult, agentProfile);
}

async function generateBannerbearImage(propertyData, agentProfile = null) {
  try {
    // Prepare base modifications from property data
    const baseModifications = propertyData.bannerbear.modifications || [];

    // Add agent modifications if profile is provided
    const agentModifications = [];
    if (agentProfile) {
      console.log('Adding agent profile modifications for OTM single image:', agentProfile);
      if (agentProfile.name) {
        agentModifications.push({ name: 'agent_name', text: agentProfile.name });
      }
      if (agentProfile.email) {
        agentModifications.push({ name: 'agent_email', text: agentProfile.email });
      }
      if (agentProfile.phone) {
        agentModifications.push({ name: 'agent_number', text: agentProfile.phone }); // Map to agent_number
      }
      if (agentProfile.photo_url) {
        agentModifications.push({ name: 'agent_photo', image_url: agentProfile.photo_url }); // Map to agent_photo
      }
    }

    const bannerbearPayload = {
      template: propertyData.bannerbear.template,
      modifications: [...baseModifications, ...agentModifications],
      ...(propertyData.bannerbear.options || {}), // Ensure options are included
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

async function generateBannerbearCollection(propertyData, templateSetUid, agentProfile = null) {
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
      { name: "estate_agent_address", text: agent.address }
    ];

    // Add agent modifications if profile is provided
    const agentModifications = [];
    if (agentProfile) {
      console.log('Adding agent profile modifications for OTM collection:', agentProfile);
      if (agentProfile.name) {
        agentModifications.push({ name: 'agent_name', text: agentProfile.name });
      }
      if (agentProfile.email) {
        agentModifications.push({ name: 'agent_email', text: agentProfile.email });
      }
      if (agentProfile.phone) {
        agentModifications.push({ name: 'agent_number', text: agentProfile.phone }); // Map to agent_number
      }
      if (agentProfile.photo_url) {
        agentModifications.push({ name: 'agent_photo', image_url: agentProfile.photo_url }); // Map to agent_photo
      }
    }

    const imageModifications = [];
    // Use each unique image for each slot, cycle only if fewer than 24
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
      modifications: [...baseModifications, ...agentModifications, ...imageModifications],
      project_id: 'E56OLrMKYWnzwl3oQj',
      metadata: {
        source: "onthemarket",
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

// Example usage:
const isMain = (() => {
  const path = process.argv[1].replace(/\\/g, '/');
  return import.meta.url.endsWith(path);
})();

if (isMain) {
  console.log('Running OnTheMarket scraper as main module...');
  (async () => {
    const url = process.argv[2] || 'https://www.onthemarket.com/details/16925924/';
    try {
      const result = await scrapeOnTheMarketProperty(url);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Error scraping property:', err);
    }
  })();
}

module.exports = {
  scrapeOnTheMarketProperty,
  generateBannerbearImage,
  generateBannerbearCollection,
  default: scrapeOnTheMarketProperty
}; 