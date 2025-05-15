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

// Helper to format OnTheMarket price with £ if missing, but do not add pcm or pw automatically
function formatOnTheMarketPrice(price) {
  if (!price) return '';
  let priceStr = price.toString().trim();
  // If already has £, return as is
  if (priceStr.startsWith('£')) {
    return priceStr;
  }
  // If it's just a number, format as £X,XXX (no pcm/pw)
  const numeric = Number(priceStr.replace(/[^0-9]/g, ''));
  if (!isNaN(numeric) && numeric > 0) {
    return `£${numeric.toLocaleString()}`;
  }
  // Fallback: just return as string
  return priceStr;
}

function formatOnTheMarketData(data) {
  // Extract only the sq ft value if square_ft is a string with both units
  let squareFtValue = data.property.square_ft;
  if (typeof squareFtValue === 'string') {
    // Match the first occurrence of digits followed by optional commas and 'sq ft'
    const match = squareFtValue.match(/([\d,]+)\s*sq\s*ft/i);
    if (match) {
      squareFtValue = match[0]; // e.g., '1,937 sq ft'
    } else {
      // fallback: just take the first number
      const numMatch = squareFtValue.match(/([\d,]+)/);
      squareFtValue = numMatch ? numMatch[0] + ' sq ft' : '';
    }
  }
  return {
    property: {
      address: data.property.address,
      price: formatOnTheMarketPrice(data.property.price),
      bedrooms: data.property.bedrooms,
      bathrooms: data.property.bathrooms,
      square_ft: squareFtValue,
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
    // Pass the correct agent profile to caption generation if available
    const agentForCaption = agentProfile ? {
        name: agentProfile.name,
        email: agentProfile.email,
        phone: agentProfile.phone,
        photo_url: agentProfile.photo_url,
        address: extractResult.data.estate_agent.address, // Keep scraped address
        logo: extractResult.data.estate_agent.logo, // Keep scraped logo
        about: ''
      } : formattedData.agent; // Fallback to scraped agent if no profile

    caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM, agentForCaption, listingType);
    if (!caption) {
      caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
    }
  } catch (error) {
    caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
  }

  // Structure the raw data, merging agentProfile if available
  const scrapedAgent = extractResult.data.estate_agent;
  const finalAgent = agentProfile ? {
      name: agentProfile.name || scrapedAgent.name, // Prioritize profile name
      address: scrapedAgent.address,                // Use scraped address
      logo: scrapedAgent.logo,                      // Use scraped logo
      email: agentProfile.email,                    // Use profile email
      phone: agentProfile.phone,                    // Use profile phone
      photo_url: agentProfile.photo_url,            // Use profile photo_url (CRITICAL)
      about: ''                                     // Add empty about field
    } : {
      // Fallback if no agentProfile
      name: scrapedAgent.name,
      address: scrapedAgent.address,
      logo: scrapedAgent.logo,
      about: ''
    };

  const rawOutput = {
    property: extractResult.data.property,
    agent: finalAgent // Use the merged or scraped agent data
  };

  return {
    raw: rawOutput, // Use the modified raw data structure
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
  const prompt = `Extract the property address, price (include the currency symbol and any suffix such as pcm as shown on the listing), number of bedrooms, number of bathrooms, square footage, description, all gallery images, key features, estate agent name, estate agent address, and estate agent logo image.\n\nReturn the result in this schema: { property: { address, price, bedrooms, bathrooms, square_ft, description, images, key_features }, estate_agent: { name, address, logo } }`;
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
  if (extractData.data && extractData.data.length > 0) {
    return processOnTheMarketResult(extractData, listingType, agentProfile);
  } else if (extractData.id) {
    // Poll for results
    const pollResult = await pollFirecrawlResults(extractData.id);
    return processOnTheMarketResult(pollResult, listingType, agentProfile);
  } else {
    throw new Error('Unexpected response format from Firecrawl');
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

async function generateBannerbearImage(propertyData, agentProfile = null) {
  try {
    // Prepare base modifications from property data
    const baseModifications = (propertyData.bannerbear.modifications || []).map(mod => {
      if (mod.name === 'property_price') {
        return { ...mod, text: formatOnTheMarketPrice(mod.text) };
      }
      return mod;
    });

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

async function generateBannerbearCollection(propertyData, templateSetUid, agentProfile = null, listing_type = null) {
  try {
    const property = propertyData.raw.property;
    const agent = propertyData.raw.agent;
    const propertyImages = property.images || property.gallery_images || [];
    const baseModifications = [
      { name: "property_price", text: formatOnTheMarketPrice(property.price) },
      { name: "property_location", text: property.address },
      { name: "bedrooms", text: property.bedrooms },
      { name: "bathrooms", text: property.bathrooms },
      { name: "sq_ft", text: formatSquareFt(property.square_ft) },
      { name: "logo", image_url: agent.logo },
      { name: "estate_agent_address", text: agent.address }
    ];

    // Add listing type modification if provided
    if (listing_type) {
      console.log(`Adding listing_type modification with value: "${listing_type}"`);
      baseModifications.push({
        name: "listing_type",
        text: listing_type
      });
    }

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

    // Add listing_type to metadata if provided
    if (listing_type) {
      collectionPayload.metadata.listing_type = listing_type;
    }

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
      const result = await scrapeOnTheMarketProperty(url, 'residential');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Error scraping property:', err);
    }
  })();
}

module.exports = {
  scrapeOnTheMarketProperty,
  formatSquareFt,
  generateBannerbearImage,
  generateBannerbearCollection
}; 