require('dotenv').config();
const fetch = require('node-fetch');

// Configuration from .env
const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;
const BANNERBEAR_TEMPLATE_UID = process.env.BANNERBEAR_TEMPLATE_UID;
const BANNERBEAR_WEBHOOK_URL = process.env.BANNERBEAR_WEBHOOK_URL;
const BANNERBEAR_TEMPLATE_SET_UID = process.env.BANNERBEAR_TEMPLATE_SET_UID;

console.log('Configuration:');
console.log(`- API Key: ${BANNERBEAR_API_KEY ? 'Set' : 'Not set'}`);
console.log(`- Template UID: ${BANNERBEAR_TEMPLATE_UID || 'Not set'}`);
console.log(`- Template Set UID: ${BANNERBEAR_TEMPLATE_SET_UID || 'Not set'}`);
console.log(`- Webhook URL: ${BANNERBEAR_WEBHOOK_URL || 'Not set'}`);

async function createTestCollection() {
  if (!BANNERBEAR_API_KEY || !BANNERBEAR_TEMPLATE_SET_UID || !BANNERBEAR_WEBHOOK_URL) {
    console.error('Missing required environment variables. Please check your .env file.');
    return;
  }

  try {
    console.log('Creating test collection...');
    
    const response = await fetch(`https://api.bannerbear.com/v2/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_set_uid: BANNERBEAR_TEMPLATE_SET_UID,
        webhook_url: BANNERBEAR_WEBHOOK_URL,
        modifications: [
          {
            name: 'Test Property',
            address: '123 Main St, Anytown, UK',
            price: '£1,250,000',
            image_url: 'https://media.rightmove.co.uk/dir/crop/10:9-16:9/232k/231998/131604678/231998_P3598_IMG_00_0000_max_476x317.jpeg',
            description: 'A beautiful 4-bedroom family home with modern amenities and spacious garden.'
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error creating collection:', data);
      return;
    }
    
    console.log('Collection created successfully:');
    console.log(`- UID: ${data.uid}`);
    console.log(`- Status: ${data.status}`);
    console.log(`- Webhook URL: ${data.webhook_url}`);
    console.log('\nWatch the Pipedream dashboard for webhook events!');
    
    return data;
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

createTestCollection(); 