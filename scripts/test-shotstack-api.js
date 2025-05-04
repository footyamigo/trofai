const fetch = require('node-fetch');

// Updated property images and agent photo
const bannerbearData = {
  modifications: [
    { name: 'property_price', text: '$2,195,000' },
    { name: 'property_location', text: '1003 NE Little River Dr, Miami, FL 33138' },
    { name: 'bedrooms', text: 4 },
    { name: 'bathrooms', text: 3 },
    { name: 'sq_ft', text: '2,564 sq ft' },
    { name: 'listing_type', text: 'Just Listed' },
    { name: 'agent_photo', image_url: 'https://trofai.s3.us-east-1.amazonaws.com/agent-photos/presidentialideas@gmail.com/b0377d4b-bcbe-4c11-adee-9ddc2990def1.png' },
    { name: 'property_image', image_url: 'https://media.onthemarket.com/properties/16571983/1532345511/image-0-1024x1024.jpg' },
    { name: 'property_image1', image_url: 'https://media.onthemarket.com/properties/16571983/1534620549/image-1-1024x1024.jpg' },
    { name: 'property_image2', image_url: 'https://media.onthemarket.com/properties/16571983/1537078423/image-2-1024x1024.jpg' },
    { name: 'property_image3', image_url: 'https://media.onthemarket.com/properties/16571983/1534612853/image-3-1024x1024.jpg' },
    { name: 'property_image4', image_url: 'https://media.onthemarket.com/properties/16571983/1537078423/image-4-1024x1024.jpg' },
    { name: 'property_image5', image_url: 'https://media.onthemarket.com/properties/16571983/1537078423/image-5-1024x1024.jpg' },
    { name: 'property_image6', image_url: 'https://media.onthemarket.com/properties/16571983/1532345511/image-6-1024x1024.jpg' },
    { name: 'property_image7', image_url: 'https://media.onthemarket.com/properties/16571983/1537078423/image-7-1024x1024.jpg' },
    { name: 'property_image8', image_url: 'https://media.onthemarket.com/properties/16571983/1532345511/image-8-1024x1024.jpg' }
  ]
};

// Mapping from Bannerbear to Shotstack (now includes property_image4)
const mapping = {
  property_image: 'PROPERTY_IMAGE',
  property_image1: 'PROPERTY_IMAGE1',
  property_image2: 'PROPERTY_IMAGE2',
  property_image3: 'PROPERTY_IMAGE3',
  property_image4: 'PROPERTY_IMAGE4',
  property_image5: 'PROPERTY_IMAGE5',
  property_image6: 'PROPERTY_IMAGE6',
  property_image7: 'PROPERTY_IMAGE7',
  property_image8: 'PROPERTY_IMAGE8',
  agent_photo: 'AGENT_PHOTO',
  property_location: 'PROPERTY_LOCATION',
  bedrooms: 'BEDROOMS',
  bathrooms: 'BATHROOMS',
  sq_ft: 'SQ_FT',
  listing_type: 'LISTING_TYPE',
  property_price: 'PROPERTY_PRICE'
};

// Build the merge array
const merge = bannerbearData.modifications.map(mod => {
  const key = mapping[mod.name];
  if (!key) return null;
  const value = mod.image_url || mod.text;
  return { find: key, replace: String(value) };
}).filter(Boolean);

// Add any static text variables you want to test
merge.push({ find: 'TEXT_VAR_464', replace: 'More details below 👇' });

// Shotstack payload
const payload = {
  id: 'ad4f6395-9357-4462-87a7-0346ba1c9dbd', // Your template ID
  merge
};

// Shotstack API endpoint and headers
const url = 'https://api.shotstack.io/edit/v1/templates/render';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-api-key': process.env.SHOTSTACK_API_KEY || 'EH81Re1DW1dVlNzga6E1Edq6qzklCohduSGkdbHY' // <-- Replace or set in env
};

async function main() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 