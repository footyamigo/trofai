const fetch = require('node-fetch');

async function testProcess() {
  try {
    const response = await fetch('http://localhost:3000/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.rightmove.co.uk/properties/159878504#/?channel=RES_LET'
      })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testProcess(); 