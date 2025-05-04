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
    location: z.string(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    square_footage: z.number().optional(),
    price: z.string(),
    photo_gallery: z.array(z.string()).optional(),
    description: z.string().optional(),
    features: z.array(z.string()).optional()
  })
});

// Helper to extract the last price from a price range string
function extractMaxPrice(priceStr) {
  if (!priceStr) return priceStr;
  const parts = priceStr.split('-');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return priceStr.trim();
}

function formatRealtorData(data) {
  const prop = data.property || {};
  return {
    property: {
      address: prop.location,
      price: extractMaxPrice(prop.price),
      bedrooms: prop.bedrooms ?? null,
      bathrooms: prop.bathrooms ?? null,
      square_ft: prop.square_footage ?? null,
      keyFeatures: prop.features || [],
      description: prop.description || '',
      allImages: prop.photo_gallery || [],
    },
    agent: {
      name: '', // Not in schema
      address: '',
      logo: '',
      about: ''
    }
  };
}

async function processRealtorResult(extractResult, listingType, agentProfile = null) {
  if (!extractResult || !extractResult.success || !extractResult.data) {
    return {
      raw: {},
      bannerbear: { metadata: { source: 'realtor' } },
      caption: '',
      error: extractResult?.error || 'Failed to extract property data'
    };
  }
  const formattedData = formatRealtorData(extractResult.data);
  let caption = '';
  try {
    const agentForCaption = agentProfile ? {
      name: agentProfile.name,
      email: agentProfile.email,
      phone: agentProfile.phone,
      photo_url: agentProfile.photo_url,
      address: '', // Realtor scraper doesn't provide these
      logo: '',    // Realtor scraper doesn't provide these
      about: ''
    } : formattedData.agent; // Fallback to empty agent from formatRealtorData

    caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM, agentForCaption, listingType);

    if (!caption) {
      caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
    }
  } catch (error) {
    caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
  }

  const finalAgent = agentProfile ? {
      name: agentProfile.name,
      address: '', // Realtor scraper doesn't provide scraped agent address
      logo: '',    // Realtor scraper doesn't provide scraped agent logo
      email: agentProfile.email,
      phone: agentProfile.phone,
      photo_url: agentProfile.photo_url,
      about: ''
    } : {
      // Fallback if no agentProfile - create an empty agent structure
      name: '',
      address: '',
      logo: '',
      about: ''
    };

  const rawOutput = {
    property: {
      ...extractResult.data.property,
      price: extractMaxPrice(extractResult.data.property.price),
      address: extractResult.data.property.location,
      square_ft: extractResult.data.property.square_footage,
      allImages: extractResult.data.property.photo_gallery || []
    },
    agent: finalAgent
  };

  // Debug log: print the first 8 images and their order
  if (rawOutput.property.allImages && Array.isArray(rawOutput.property.allImages)) {
    console.log('[Realtor Scraper] First 8 images in allImages:', rawOutput.property.allImages.slice(0, 8));
  }

  return {
    raw: rawOutput,
    bannerbear: { metadata: { source: 'realtor' } },
    caption,
  };
}

async function scrapeRealtorProperty(propertyUrl, listingType, agentProfile = null) {
  const extractResult = await app.extract([
    propertyUrl
  ], {
    prompt: "Extract the property location, number of bedrooms, number of bathrooms, square footage, property price, all property photo gallery image links, property description, and features.",
    schema,
  });
  return processRealtorResult(extractResult, listingType, agentProfile);
}

async function generateBannerbearImage(propertyData, agentProfile = null) {
  try {
    const baseModifications = [
      { name: 'property_image', image_url: propertyData.property.allImages[0] },
      { name: 'property_price', text: propertyData.property.price },
      { name: 'property_location', text: propertyData.property.address },
      { name: 'bedrooms', text: propertyData.property.bedrooms ?? '' },
      { name: 'bathrooms', text: propertyData.property.bathrooms ?? '' },
      { name: 'sq_ft', text: formatSquareFt(propertyData.property.square_ft) },
    ];
    if (propertyData.property.keyFeatures && propertyData.property.keyFeatures.length > 0) {
      baseModifications.push({ name: 'property_features', text: propertyData.property.keyFeatures.slice(0, 5).join(', ') });
    }

    const agentModifications = [];
    if (agentProfile) {
      console.log('[Realtor Scraper] Adding agent profile modifications for single image:', agentProfile);
      if (agentProfile.name) {
        agentModifications.push({ name: 'agent_name', text: agentProfile.name });
      }
      if (agentProfile.email) {
        agentModifications.push({ name: 'agent_email', text: agentProfile.email });
      }
      if (agentProfile.phone) {
        agentModifications.push({ name: 'agent_number', text: agentProfile.phone });
      }
      if (agentProfile.photo_url) {
        agentModifications.push({ name: 'agent_photo', image_url: agentProfile.photo_url });
      }
    }

    const bannerbearPayload = {
      template: serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID,
      modifications: [...baseModifications, ...agentModifications],
      ...BANNERBEAR_TEMPLATE_CONFIG.options,
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

async function generateBannerbearCollection(propertyData, templateSetUid, agentProfile = null, listing_type = null) {
  try {
    console.log('[Realtor Scraper] Entering generateBannerbearCollection');
    const property = propertyData.raw.property || {};
    const propertyImages = property.photo_gallery || [];

    console.log('[Realtor Scraper] Extracted propertyImages:', JSON.stringify(propertyImages, null, 2));
    console.log(`[Realtor Scraper] Total images extracted: ${propertyImages.length}`);

    const baseModifications = [
      { name: 'property_price', text: property.price },
      { name: 'property_location', text: property.location },
      { name: 'bedrooms', text: property.bedrooms ?? '' },
      { name: 'bathrooms', text: property.bathrooms ?? '' },
      { name: 'sq_ft', text: formatSquareFt(property.square_footage) },
    ];
    if (property.features && property.features.length > 0) {
      baseModifications.push({ name: 'property_features', text: property.features.slice(0, 5).join(', ') });
    }

    const agentModifications = [];
    if (agentProfile) {
      console.log('[Realtor Scraper] Adding agent profile modifications for collection:', agentProfile);
      if (agentProfile.name) {
        agentModifications.push({ name: 'agent_name', text: agentProfile.name });
      }
      if (agentProfile.email) {
        agentModifications.push({ name: 'agent_email', text: agentProfile.email });
      }
      if (agentProfile.phone) {
        agentModifications.push({ name: 'agent_number', text: agentProfile.phone });
      }
      if (agentProfile.photo_url) {
        agentModifications.push({ name: 'agent_photo', image_url: agentProfile.photo_url });
      }
    }

    if (listing_type) {
      console.log(`[Realtor Scraper] Adding listing_type modification with value: "${listing_type}"`);
      agentModifications.push({
        name: "listing_type",
        text: listing_type
      });
    }

    const imageModifications = [];
    for (let i = 0; i <= 23; i++) {
      const layerName = i === 0 ? 'property_image' : `property_image${i}`;
      const imageIndex = i < propertyImages.length ? i : i % propertyImages.length;
      if (propertyImages[imageIndex]) {
        imageModifications.push({
          name: layerName,
          image_url: propertyImages[imageIndex]
        });
      }
    }

    const finalModifications = [...baseModifications, ...agentModifications, ...imageModifications];

    const collectionPayload = {
      template_set: templateSetUid,
      modifications: finalModifications,
      project_id: 'E56OLrMKYWnzwl3oQj',
      metadata: {
        source: 'realtor',
        scraped_at: new Date().toISOString(),
        property_location: property.location,
        total_images: propertyImages.length
      }
    };
    if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
      collectionPayload.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
      collectionPayload.webhook_headers = {
        'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
      };
    }

    console.log('[Realtor Scraper] Final modifications being sent to Bannerbear:', JSON.stringify(finalModifications, null, 2));
    console.log('[Realtor Scraper] Full Bannerbear Payload (excluding headers):', JSON.stringify({...collectionPayload, webhook_headers: undefined }, null, 2));

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
  scrapeRealtorProperty,
  generateBannerbearImage,
  generateBannerbearCollection,
  default: scrapeRealtorProperty
}; 