// Direct test file to check Firecrawl API connectivity
require('dotenv').config();
const fetch = require('node-fetch');

// The API key - try multiple sources
const API_KEY = process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;

// Test URL
const RIGHTMOVE_URL = "https://www.rightmove.co.uk/properties/160453565#/?channel=RES_LET";

async function testFirecrawlExtraction() {
    console.log('-------------------------');
    console.log('FIRECRAWL API TEST');
    console.log('-------------------------');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key exists:', !!API_KEY);
    console.log('API Key prefix:', API_KEY ? API_KEY.substring(0, 5) : 'MISSING');
    
    try {
        const requestBody = {
            urls: [RIGHTMOVE_URL],
            prompt: "Capture the price, address, number of bedrooms, bathrooms, and square ft of the property. Include the name, address, and logo of the estate agent."
        };
        
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Accept': 'application/json',
                'User-Agent': 'TrofaiApp/1.0'
            },
            body: JSON.stringify(requestBody)
        };
        
        console.log('Request headers:', JSON.stringify(requestOptions.headers, null, 2));
        console.log('Making request to Firecrawl API...');
        
        const response = await fetch('https://api.firecrawl.dev/v1/extract', requestOptions);
        
        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
        
        // Get response as text first
        const responseText = await response.text();
        console.log('Response text first 500 chars:', responseText.substring(0, 500));
        
        // Check if it's HTML
        if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
            responseText.trim().toLowerCase().startsWith('<html')) {
            console.error('RECEIVED HTML RESPONSE - AUTHENTICATION LIKELY FAILED');
            return { success: false, error: 'Received HTML response, not JSON' };
        }
        
        // Try to parse JSON
        try {
            const data = JSON.parse(responseText);
            console.log('Successfully parsed JSON response');
            console.log('Response data:', JSON.stringify(data, null, 2));
            return { success: true, data };
        } catch (parseError) {
            console.error('JSON PARSE ERROR:', parseError.message);
            return { success: false, error: parseError.message };
        }
    } catch (error) {
        console.error('REQUEST ERROR:', error.message);
        return { success: false, error: error.message };
    }
}

// Execute the test
testFirecrawlExtraction()
    .then(result => {
        console.log('-------------------------');
        console.log('TEST RESULT:', result.success ? 'SUCCESS' : 'FAILURE');
        console.log('-------------------------');
        if (!result.success) {
            console.error('ERROR:', result.error);
        }
    })
    .catch(error => {
        console.error('UNCAUGHT ERROR:', error);
    }); 