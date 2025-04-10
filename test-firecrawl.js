// Test script for Firecrawl integration
require('dotenv').config();

// Import the Rightmove scraper directly
const rightmoveScraper = require('./utils/firecrawl-rightmove-scraper');

async function testFirecrawl() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node test-firecrawl.js <rightmove-url>');
    process.exit(1);
  }

  console.log('\n===========================================');
  console.log('  FIRECRAWL PROPERTY EXTRACTION TEST');
  console.log('===========================================\n');
  console.log(`Testing Firecrawl extraction on URL: ${url}\n`);

  try {
    console.log('Starting extraction with Firecrawl API...');
    console.time('Extraction time');
    
    // Use the Rightmove scraper directly
    const propertyData = await rightmoveScraper.scrapeRightmoveProperty(url);
    
    console.timeEnd('Extraction time');
    console.log(`\nSuccessfully extracted property data in ${(console.timeEnd || (() => {}))('Extraction time') || '?'} seconds!`);
    
    // Log property details
    console.log('\n===========================================');
    console.log('  PROPERTY INFORMATION');
    console.log('===========================================');
    console.log(`- Address: ${propertyData.raw.property.address}`);
    console.log(`- Price: ${propertyData.raw.property.price}`);
    console.log(`- Bedrooms: ${propertyData.raw.property.bedrooms}`);
    console.log(`- Bathrooms: ${propertyData.raw.property.bathrooms}`);
    console.log(`- Square ft: ${propertyData.raw.property.square_ft}`);
    console.log(`- Total images: ${propertyData.raw.property.allImages.length}`);
    
    // Log agent details
    console.log('\n===========================================');
    console.log('  AGENT INFORMATION');
    console.log('===========================================');
    console.log(`- Name: ${propertyData.raw.agent.name}`);
    console.log(`- Address: ${propertyData.raw.agent.address}`);
    console.log(`- Logo: ${propertyData.raw.agent.logo ? 'Present' : 'Missing'}`);
    
    // Log key features
    console.log('\n===========================================');
    console.log('  KEY FEATURES');
    console.log('===========================================');
    propertyData.raw.property.keyFeatures.forEach((feature, index) => {
      console.log(`${index + 1}. ${feature}`);
    });
    
    // Log a sample image URL
    console.log('\n===========================================');
    console.log('  SAMPLE IMAGE URL');
    console.log('===========================================');
    console.log(propertyData.raw.property.mainImage);
    
    // Log a snippet of the description
    console.log('\n===========================================');
    console.log('  PROPERTY DESCRIPTION (EXCERPT)');
    console.log('===========================================');
    const description = propertyData.raw.property.description;
    console.log(description.substring(0, Math.min(150, description.length)) + '...');
    
    // Log the caption
    console.log('\n===========================================');
    console.log('  GENERATED CAPTION (EXCERPT)');
    console.log('===========================================');
    const caption = propertyData.caption;
    console.log(caption.substring(0, Math.min(150, caption.length)) + '...');
    console.log(`Full caption length: ${caption.length} characters`);
    
    // Log Bannerbear structure
    console.log('\n===========================================');
    console.log('  BANNERBEAR DATA STRUCTURE');
    console.log('===========================================');
    console.log(`Template ID: ${propertyData.bannerbear.template}`);
    console.log(`Number of modifications: ${propertyData.bannerbear.modifications.length}`);
    console.log(`Source: ${propertyData.bannerbear.metadata.source}`);
    console.log(`Webhook URL: ${propertyData.bannerbear.webhook_url || 'None'}`);
    
    console.log('\n===========================================');
    console.log('  TEST COMPLETED SUCCESSFULLY!');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n===========================================');
    console.error('  ERROR DURING TEST');
    console.error('===========================================');
    console.error(error);
    console.error('\n===========================================\n');
    process.exit(1);
  }
}

// Run the test
testFirecrawl(); 