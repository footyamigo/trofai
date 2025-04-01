const http = require('http');
const crypto = require('crypto');

// Configuration
const webhookUrl = 'http://localhost:3000/webhook';
const webhookSecret = 'bb_wh_b8925dda9f9bcdd3988515e8a85d69';

// Function to sign the payload with the secret
function generateSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Simulated webhook payload for a single image
const singlePayload = JSON.stringify({
  uid: 'test-' + Date.now(),
  status: 'completed',
  type: 'single',
  created_at: new Date().toISOString(),
  metadata: {
    custom_key: 'custom_value'
  }
});

// Simulated webhook payload for a collection
const collectionPayload = JSON.stringify({
  uid: 'collection-' + Date.now(),
  status: 'completed',
  type: 'collection',
  created_at: new Date().toISOString(),
  images: [
    {
      uid: 'img1-' + Date.now(),
      status: 'completed'
    },
    {
      uid: 'img2-' + Date.now(),
      status: 'completed'
    }
  ]
});

// Function to send a request
function sendRequest(payload, type) {
  const signature = generateSignature(payload, webhookSecret);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${signature}`
    }
  };

  const req = http.request(webhookUrl, options, (res) => {
    console.log(`${type} - Status Code:`, res.statusCode);
    
    res.on('data', (chunk) => {
      console.log(`${type} - Response:`, chunk.toString());
    });
  });

  req.on('error', (e) => {
    console.error(`${type} - Error:`, e.message);
  });

  req.write(payload);
  req.end();
}

// Send test requests
console.log('Sending test webhook requests...');
sendRequest(singlePayload, 'Single Image');
setTimeout(() => {
  sendRequest(collectionPayload, 'Collection');
}, 1000); 