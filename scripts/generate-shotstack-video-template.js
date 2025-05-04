require('dotenv').config(); // Load .env file variables
const fs = require('fs'); // Added for file system access
const path = require('path'); // Added for path manipulation

console.log('Script starting...'); // Added for debugging
const fetch = require('node-fetch');

// --- CONFIGURATION ---
const API_KEY = process.env.SHOTSTACK_API_KEY; // Load API key from environment variable
const RENDER_URL = 'https://api.shotstack.io/edit/v1/templates/render'; // Endpoint for template rendering
const SERVE_STATUS_URL = id => `https://api.shotstack.io/serve/v1/assets/render/${id}`;

// Removed fallback image URL constant
// const FALLBACK_IMAGE_URL = "https://via.placeholder.com/1x1/transparent";

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-api-key': API_KEY
};

// Helper function to format square footage
function formatSquareFt(sqft) {
  if (!sqft || sqft === '0' || sqft === 0) return "N/A";
  const numericValue = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, ''), 10) : sqft;
  if (isNaN(numericValue) || numericValue <= 0) return "N/A";
  const formattedValue = numericValue.toLocaleString();
  return `${formattedValue} SQ FT`;
}

// Helper function to format price for OnTheMarket
function formatOnTheMarketPrice(price) {
  if (!price) return '';
  // If already a string with £, return as is
  if (typeof price === 'string' && price.trim().startsWith('£')) return price;
  // Otherwise, format as currency
  return `£${Number(price).toLocaleString()}`;
}

// Function to create the merge array dynamically
// (This remains the same as the previous version, as it prepares the data for merging)
function createMergeArray(scrapedData, listingType, templateId) {
  const { property, agent } = scrapedData;
  // Filter images to ensure a dense array of valid URLs
  const images = (property.allImages || property.images || []).filter(Boolean).slice(0, 8); // Only first 8 images

  // Detect OnTheMarket source
  const isOnTheMarket = scrapedData.bannerbear && scrapedData.bannerbear.metadata && scrapedData.bannerbear.metadata.source === 'onthemarket';

  // Special casing for template 4 (all caps listing type)
  let listingTypeForMerge = listingType;
  if (templateId === 'dd7b513a-ec5f-4be9-aed1-f5963a403036' && listingType) {
    listingTypeForMerge = listingType.toUpperCase();
  }

  const merge = [
    // Property details
    { find: "PROPERTY_PRICE", replace: isOnTheMarket ? formatOnTheMarketPrice(property.price) : (property.price || "") },
    { find: "PROPERTY_LOCATION", replace: property.address || "" },
    { find: "LISTING_TYPE", replace: listingTypeForMerge || "" },
    { find: "BEDROOMS", replace: String(property.bedrooms || 0) },
    { find: "BATHROOMS", replace: String(property.bathrooms || 0) },
    { find: "SQUARE_FT", replace: formatSquareFt(property.square_ft) },

    // Static Icons (Assuming these placeholders exist in your template)
    { find: "SQFT_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-70t5z-vp03m-8bqmd-ahq57s/source.png" },
    { find: "BATHROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6yxew-r43vb-xe47k-bcnedf/source.png" },
    { find: "BEDROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6x636-qz50c-xh6as-m0r5ns/source.png" },

    // Dark Shadows (Assuming these placeholders exist in your template)
    { find: "DARK_SHADOW", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },
    { find: "DARK_SHADOW2", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },

    // Add Static Audio Track
    {
      find: "AUDIO",
      replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jt4-2na8b-5yznd-srprz-rp0kqs/source.mp3"
    },
    // Add Static Background
    {
      find: "BACKGROUND",
      replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsy-hvw6j-2b5n4-cqrp8-vw0feh/source.png"
    },
    // Add BACKGROUND2
    {
      find: "BACKGROUND2",
      replace: "https://shotstack-ingest-api-v1-renditions.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsy-k22g1-4y2r3-twj34-qdea5t/shotstack-proxy.webp"
    },
    // Add BACKGROUND3
    {
      find: "BACKGROUND3",
      replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jtd-6zstb-qav3v-btv8s-3v4mye/source.png"
    },
    // Add AUDIO2
    {
      find: "AUDIO2",
      replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jt5-gzszc-q0q92-x0yyg-8avp4w/source.mp3"
    }
  ];

  // Add property images (up to 8, assuming placeholders PROPERTY_IMAGE1 to PROPERTY_IMAGE8 exist)
  for (let i = 1; i <= 8; i++) {
    const imageUrl = images[i - 1] || property.mainImage || images[0]; // Get potential URL
    if (imageUrl) { // Only add merge field if we found a valid URL
        merge.push({
          find: `PROPERTY_IMAGE${i}`,
          replace: imageUrl 
        });
    } else {
        console.warn(`No valid image found for placeholder PROPERTY_IMAGE${i}. Omitting.`);
    }
  }

  // Add agent details - assumes agent_photo_url is mandatory if agent exists
  if (agent) {
    // --> Add detailed logging before the check
    console.log('[createMergeArray] Checking agent object:', JSON.stringify(agent, null, 2));
    console.log('[createMergeArray] Value of agent.photo_url:', agent.photo_url);
    // <-- End detailed logging
    
    if (agent.photo_url) {
        merge.push({ find: "AGENT_PHOTO", replace: agent.photo_url });
    } else {
        // Throw error if agent exists but mandatory photo URL is missing
        throw new Error('Agent data provided but mandatory photo_url is missing.');
    }
    // Add email and phone (assuming these are okay to be potentially empty/null)
    // Check for common variations of keys
    const agentEmail = agent.agent_email || agent.email; 
    const agentPhone = agent.agent_phone || agent.phone;

    if (agentEmail) {
        console.log(`[createMergeArray] Found agent email: ${agentEmail}`);
        merge.push({ find: "AGENT_EMAIL", replace: agentEmail });
    } else {
        console.warn("[createMergeArray] Agent email key (agent_email or email) not found in agent data.");
    }
    if (agentPhone) {
        console.log(`[createMergeArray] Found agent phone: ${agentPhone}`);
        merge.push({ find: "AGENT_PHONE", replace: agentPhone });
    } else {
        console.warn("[createMergeArray] Agent phone key (agent_phone or phone) not found in agent data.");
    }
  } else {
      // If no agent data at all, we might need to handle placeholders differently
      // depending on template requirements. For now, just log it.
      console.warn("No agent data found in scrapedData. Agent-related placeholders might not be filled.");
  }

  return merge;
}

// Polling function (remains the same)
async function pollStatus(renderId, interval = 5000, maxAttempts = 30) {
  await new Promise(r => setTimeout(r, 8000)); // Initial wait
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let data;
    try {
      const res = await fetch(SERVE_STATUS_URL(renderId), { headers });
      data = await res.json();
    } catch (err) {
      console.log(`Polling attempt ${attempt}: Invalid or empty JSON, retrying...`);
      await new Promise(r => setTimeout(r, interval));
      continue;
    }
    console.log(`Polling attempt ${attempt}: Full response =`, JSON.stringify(data, null, 2));
    if (data && Array.isArray(data.data)) {
      for (const asset of data.data) {
        const attrs = asset.attributes;
        if (attrs.status === 'ready' && attrs.url) {
          console.log(`
✅ Asset is ready! Download URL: ${attrs.url}`);
          return attrs.url;
        }
      }
    }
    console.log(`Polling attempt ${attempt}: No asset ready yet.`);
    await new Promise(r => setTimeout(r, interval));
  }
  console.error('❌ Max polling attempts reached. Asset not ready.');
  throw new Error('Video rendering timed out or failed.'); // Throw error on failure
}

// Main function to generate video from scraped data using a template ID
async function generateVideoFromTemplate(scrapedData, listingType, templateId) {
  // Add check for API Key
  if (!API_KEY) {
    throw new Error('Shotstack API key is missing. Please set the SHOTSTACK_API_KEY environment variable.');
  }
  if (!scrapedData || !scrapedData.property) {
    throw new Error('Invalid scraped data provided.');
  }
  if (!listingType) {
    throw new Error('Listing type is required.');
  }
  if (!templateId) {
    throw new Error('Shotstack Template ID is required.');
  }

  try {
    console.log('Creating merge array from scraped data...');
    const mergeArray = createMergeArray(scrapedData, listingType, templateId);

    // Payload for the template render endpoint
    const payload = {
      id: templateId,
      merge: mergeArray,
      destinations: [
        {
          provider: "s3",
          options: {
            region: "us-east-1", // <-- IMPORTANT: Change this if your bucket region is different!
            bucket: "trofai",
            prefix: "trofai-videos" // Path within the bucket
          }
        },
        // Add Shotstack opt-out
        {
          provider: "shotstack",
          exclude: true
        }
      ]
    };

    console.log('FINAL PAYLOAD TO SHOTSTACK:', JSON.stringify(payload, null, 2));
    console.log(`Sending render request to Shotstack template endpoint for template ID: ${templateId}...`);
    // console.log('Payload:', JSON.stringify(payload, null, 2)); // Optional: Log full payload

    const res = await fetch(RENDER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Shotstack Initial Response Status:', res.status);
    console.log('Shotstack Initial Response Body:', JSON.stringify(data, null, 2));

    const renderId = data.response && data.response.id;
    if (renderId) {
      console.log(`Render queued with ID: ${renderId}. Starting polling...`);
      const videoUrl = await pollStatus(renderId);
      return videoUrl; // Return the final video URL
    } else {
      console.error('No render ID returned from Shotstack.', data);
      throw new Error(`Shotstack failed to queue render: ${data.message || JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error('Error during Shotstack template video generation:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}

// Export the main function
module.exports = { generateVideoFromTemplate };

async function test() {
  console.log('Inside test() function...'); // Added for debugging
  console.log('Testing generateVideoFromTemplate function with config file...');

  // --- Read Template ID from Config ---
  let exampleTemplateId;
  try {
    const templatesPath = path.join(__dirname, '..', 'config', 'shotstack-templates.json');
    const templatesJson = fs.readFileSync(templatesPath, 'utf8');
    const templateIds = JSON.parse(templatesJson);
    if (!templateIds || templateIds.length === 0) {
      throw new Error('No template IDs found in config/shotstack-templates.json');
    }
    exampleTemplateId = templateIds[0]; // Use the first template ID
    console.log(`Using Template ID from config: ${exampleTemplateId}`);
  } catch (err) {
    console.error('Error reading template config file:', err);
    return; // Stop the test if config cannot be read
  }
  // --- End Read Template ID ---

  const exampleScrapedData = {
    property: {
      address: "Test Template Property, 456 Test Ave, Testopia",
      price: "£999,999",
      bedrooms: 5,
      bathrooms: 4,
      square_ft: 3000,
      allImages: [ // Provide at least 8 images for the template placeholders
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_02_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_03_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_04_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_05_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_06_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_07_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_08_0001.jpeg"
      ],
      mainImage: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg" // Fallback if needed
    },
    agent: {
      agent_photo_url: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsm-wt9wc-tbq5a-szmet-kkm5e7/source.png",
      agent_email: "template.test@example.com",
      agent_phone: "+9876543210"
    }
  };
  const exampleListingType = "For Rent";
  // const exampleTemplateId = "fe972dc0-5ee0-4fa6-8bf5-079b6833c8fa"; // Use the template ID you provided - Replaced by config read

  try {
    // Ensure API key is set in environment variables before running test
    if (!process.env.SHOTSTACK_API_KEY) {
       console.warn("SHOTSTACK_API_KEY environment variable not set. Test may fail to authenticate.");
    }
    const videoUrl = await generateVideoFromTemplate(exampleScrapedData, exampleListingType, exampleTemplateId);
    console.log(`---> Test successful! Video URL: ${videoUrl}`);
  } catch (error) {
    console.error('---> Test failed:', error.message, error.stack);
  }
}

/* // Comment block for example usage description
// The test function and its call are now moved outside this block.

// Uncomment the line below to run the test when executing this file directly:
// console.log('Calling test() function...'); // Added for debugging
// test(); // Now this line will execute 
*/

// Only run the test() function if the script is executed directly
if (require.main === module) {
  console.log('Script executed directly, calling test() function...'); 
  test(); 
} 