const fetch = require('node-fetch');

// --- CONFIGURATION ---
const TEMPLATE_ID = 'fe972dc0-5ee0-4fa6-8bf5-079b6833c8fa';
const API_KEY = process.env.SHOTSTACK_API_KEY || 'EH81Re1DW1dVlNzga6E1Edq6qzklCohduSGkdbHY'; // Replace with your API key or set env var

const merge = [
  { find: 'PROPERTY_IMAGE1', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_01_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE2', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_02_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE3', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_03_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE4', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_04_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE5', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_05_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE6', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_06_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE7', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_07_0001.jpeg?v2' },
  { find: 'PROPERTY_IMAGE8', replace: 'https://media.rightmove.co.uk/66k/65827/157839893/65827_SLA012407974_IMG_08_0001.jpeg?v2' },
  { find: 'SQFT_ICON', replace: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-70t5z-vp03m-8bqmd-ahq57s/source.png' },
  { find: 'BATHROOM_ICON', replace: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6yxew-r43vb-xe47k-bcnedf/source.png' },
  { find: 'BEDROOM_ICON', replace: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6x636-qz50c-xh6as-m0r5ns/source.png' },
  { find: 'DARK_SHADOW', replace: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png' },
  { find: 'PROPERTY_PRICE', replace: '£5,500 pcm' },
  { find: 'PROPERTY_LOCATION', replace: 'Tregunter Road, Chelsea,  London, SW10, United Kingdom' },
  { find: 'LISTING_TYPE', replace: 'Just Listed' },
  { find: 'BEDROOMS', replace: '3' },
  { find: 'BATHROOMS', replace: '4' },
  { find: 'SQUARE_FT', replace: '1456 SQ FT' },
  { find: 'DARK_SHADOW2', replace: 'https://shotstack-ingest-api-v1-sources.s3.ap-southeast-2.amazonaws.com/tw9scym7kz/zzz01jsp-6hzym-4eg57-5hcgx-xhsmy7/source.png' },
  { find: 'AGENT_PHOTO', replace: 'https://trofai.s3.us-east-1.amazonaws.com/agent-photos/presidentialideas@gmail.com/b0377d4b-bcbe-4c11-adee-9ddc2990def1.png?v=2' }
];

const renderUrl = 'https://api.shotstack.io/v1/templates/render';
const SERVE_STATUS_URL = id => `https://api.shotstack.io/serve/v1/assets/render/${id}`;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-api-key': API_KEY
};

async function pollStatus(renderId, interval = 5000, maxAttempts = 30) {
  // Wait before first poll to allow asset to become available
  await new Promise(r => setTimeout(r, 8000)); // 8 seconds
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
  return null;
}

async function main() {
  try {
    const payload = { id: TEMPLATE_ID, merge, output: { quality: 'high' } };
    console.log('Sending render request to Shotstack templates endpoint...');
    const res = await fetch(renderUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    const renderId = data.response && data.response.id;
    if (renderId) {
      await pollStatus(renderId);
    } else {
      console.error('No render ID returned.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 