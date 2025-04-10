// Test for the modified Rightmove scraper
require('dotenv').config();
const { scrapeRightmoveProperty } = require('./utils/firecrawl-rightmove-scraper');

// The test URL
const RIGHTMOVE_URL = "https://www.rightmove.co.uk/properties/160453565#/?channel=RES_LET";

async function testScraper() {
    console.log('-------------------------');
    console.log('TESTING RIGHTMOVE SCRAPER');
    console.log('-------------------------');
    console.log('URL:', RIGHTMOVE_URL);
    
    try {
        console.log('Starting scrape...');
        const result = await scrapeRightmoveProperty(RIGHTMOVE_URL);
        
        console.log('-------------------------');
        console.log('SCRAPE SUCCESSFUL!');
        console.log('-------------------------');
        
        // Print a summary of the results
        console.log('Result summary:');
        console.log('- Property address:', result.raw.property.address);
        console.log('- Property price:', result.raw.property.price);
        console.log('- Bedrooms:', result.raw.property.bedrooms);
        console.log('- Bathrooms:', result.raw.property.bathrooms);
        console.log('- Agent name:', result.raw.agent.name);
        console.log('- Image count:', (result.raw.property.allImages || []).length);
        console.log('- Caption length:', result.caption ? result.caption.length : 0);
        
        return { success: true, result };
    } catch (error) {
        console.error('-------------------------');
        console.error('SCRAPE FAILED!');
        console.error('-------------------------');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        return { success: false, error };
    }
}

// Run the test
testScraper()
    .then(status => {
        console.log('\nTest completed with status:', status.success ? 'SUCCESS' : 'FAILURE');
        process.exit(status.success ? 0 : 1);
    })
    .catch(err => {
        console.error('Unhandled error in test:', err);
        process.exit(1);
    }); 