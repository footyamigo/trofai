const fetch = require('node-fetch');

// --- CONFIGURATION ---
const API_KEY = process.env.SHOTSTACK_API_KEY || 'EH81Re1DW1dVlNzga6E1Edq6qzklCohduSGkdbHY'; // Replace with your API key or set env var
const RENDER_URL = 'https://api.shotstack.io/edit/v1/templates/render'; // Updated endpoint for templates
const SERVE_STATUS_URL = id => `https://api.shotstack.io/serve/v1/assets/render/${id}`;

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-api-key': API_KEY
};

// Fixed timeline structure with placeholders
// Removed TIMELINE_STRUCTURE as it's now defined in the Shotstack template

// Helper function to format square footage
function formatSquareFt(sqft) {
  if (!sqft || sqft === '0' || sqft === 0) return "N/A";
  const numericValue = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, ''), 10) : sqft;
  if (isNaN(numericValue) || numericValue <= 0) return "N/A";
  const formattedValue = numericValue.toLocaleString();
  return `${formattedValue} SQ FT`;
}

// Function to create the merge array dynamically
function createMergeArray(scrapedData, listingType) {
  const { property, agent } = scrapedData;
  // Filter images to ensure a dense array of valid URLs
  const images = (property.allImages || property.images || []).filter(Boolean);

  const merge = [
    // Property details
    { find: "PROPERTY_PRICE", replace: property.price || "" },
    { find: "PROPERTY_LOCATION", replace: property.address || "" },
    { find: "LISTING_TYPE", replace: listingType || "" },
    { find: "BEDROOMS", replace: String(property.bedrooms || 0) },
    { find: "BATHROOMS", replace: String(property.bathrooms || 0) },
    { find: "SQUARE_FT", replace: formatSquareFt(property.square_ft) },

    // Static Icons
    { find: "SQFT_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-70t5z-vp03m-8bqmd-ahq57s/source.png" },
    { find: "BATHROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6yxew-r43vb-xe47k-bcnedf/source.png" },
    { find: "BEDROOM_ICON", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6x636-qz50c-xh6as-m0r5ns/source.png" },

    // Dark Shadows
    { find: "DARK_SHADOW", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },
    { find: "DARK_SHADOW2", replace: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png" },
  ];

  // Add property images (up to 8)
  for (let i = 1; i <= 8; i++) {
    merge.push({
      find: `PROPERTY_IMAGE${i}`,
      replace: images[i - 1] || property.mainImage || images[0] || ""
    });
  }

  // Add agent details if available
  if (agent && agent.agent_photo_url) {
    merge.push({ find: "AGENT_PHOTO", replace: agent.agent_photo_url });
  }
  if (agent && agent.agent_email) {
    merge.push({ find: "AGENT_EMAIL", replace: agent.agent_email });
  }
  if (agent && agent.agent_phone) {
    merge.push({ find: "AGENT_PHONE", replace: agent.agent_phone });
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
          console.log(`\n✅ Asset is ready! Download URL: ${attrs.url}`);
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
async function generateVideoFromData(scrapedData, listingType, templateId) {
  if (!scrapedData || !scrapedData.property) {
    throw new Error('Invalid scraped data provided.');
  }
  if (!listingType) {
    throw new Error('Listing type is required.');
  }
  if (!templateId) { // Added check for templateId
    throw new Error('Shotstack Template ID is required.');
  }

  try {
    console.log('Creating merge array from scraped data...');
    const mergeArray = createMergeArray(scrapedData, listingType);

    // Updated payload to use template ID and merge array
    const payload = {
      id: templateId,
      merge: mergeArray
      // Removed timeline and output as they are part of the template
    };

    console.log(`Sending render request to Shotstack template endpoint for template ID: ${templateId}...`);
    // console.log('Payload:', JSON.stringify(payload, null, 2)); // Optional: Log full payload for debugging

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
    console.error('Error during Shotstack video generation:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}

// Export the main function
module.exports = { generateVideoFromData };

// --- Example Usage (for testing this module directly) ---
/*
async function test() {
  console.log('Testing generateVideoFromData function with Template ID...');
  // Example scraped data (replace with actual data structure from your scrapers)
  const exampleScrapedData = {
    property: {
      address: "Test Property, 123 Test St, Testville",
      price: "£1,000,000",
      bedrooms: 4,
      bathrooms: 3,
      square_ft: 2000,
      allImages: [
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_02_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_03_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_04_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_05_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_06_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_07_0001.jpeg",
        "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_08_0001.jpeg"
      ],
      mainImage: "https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg"
    },
    agent: {
      name: "Test Agent Inc.",
      logo: "https://via.placeholder.com/150",
      agent_photo_url: "https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsm-wt9wc-tbq5a-szmet-kkm5e7/source.png", // Example agent photo
      agent_email: "test.agent@example.com", // Example agent email
      agent_phone: "+1234567890" // Example agent phone
    }
  };
  const exampleListingType = "Just Sold";
  const exampleTemplateId = "fe972dc0-5ee0-4fa6-8bf5-079b6833c8fa"; // Replace with your actual Template ID

  try {
    const videoUrl = await generateVideoFromData(exampleScrapedData, exampleListingType, exampleTemplateId);
    console.log(`
---> Test successful! Video URL: ${videoUrl}`);
  } catch (error) {
    console.error('
---> Test failed:', error.message);
  }
}

// Uncomment to run the test when executing this file directly:
// test();
*/ 