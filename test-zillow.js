// Simple test script just for Zillow
require('dotenv').config();
const { scrapeZillowProperty } = require('./firecrawl-zillow-scraper');

async function testZillowOnly() {
  try {
    console.log('Testing Zillow Scraper');
    
    // Use the district-west URL from the Firecrawl example
    const url = "https://zillow.com/apartments/orlando-fl/district-west/CJ9MZg";
    console.log(`URL: ${url}`);
    
    const result = await scrapeZillowProperty(url);
    
    console.log('\nSuccess! Property details:');
    console.log(`Address: ${result.raw.property.address}`);
    console.log(`Price: ${result.raw.property.price}`);
    console.log(`Bedrooms: ${result.raw.property.bedrooms}`);
    console.log(`Bathrooms: ${result.raw.property.bathrooms}`);
    console.log(`Images: ${result.raw.property.allImages.length}`);
    
    // Specifically check management company details
    console.log('\nManagement Company Details:');
    console.log(`Name: ${result.raw.agent.name}`);
    console.log(`Phone: ${result.raw.agent.phone}`);
    console.log(`Logo: ${result.raw.agent.logo ? 'Present' : 'Not found'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testZillowOnly(); 