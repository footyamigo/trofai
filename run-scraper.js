#!/usr/bin/env node
/**
 * Command-line tool to run property scraping with either RoboRabbit or Firecrawl
 * 
 * Usage:
 *   node run-scraper.js [URL] [--firecrawl | --roborabbit]
 * 
 * Examples:
 *   node run-scraper.js https://www.rightmove.co.uk/properties/141476078 --firecrawl
 *   node run-scraper.js https://www.rightmove.co.uk/properties/141476078 --roborabbit
 */

require('dotenv').config();

// Process command line arguments
const args = process.argv.slice(2);
let propertyUrl = null;
let forceFirecrawl = false;
let forceRoboRabbit = false;

// Parse arguments
args.forEach(arg => {
  if (arg.startsWith('http')) {
    propertyUrl = arg;
  } else if (arg === '--firecrawl') {
    forceFirecrawl = true;
  } else if (arg === '--roborabbit') {
    forceRoboRabbit = true;
  }
});

// Set environment variable based on command-line flag
if (forceFirecrawl) {
  process.env.USE_FIRECRAWL = 'true';
} else if (forceRoboRabbit) {
  process.env.USE_FIRECRAWL = 'false';
}

// Default URL if none provided
if (!propertyUrl) {
  propertyUrl = 'https://www.rightmove.co.uk/properties/141476078';
  console.log(`No URL provided, using default: ${propertyUrl}`);
}

// Import the unified scraper
const scraper = require('./scraper');

// Track timing for comparison
const startTime = Date.now();

// Run the test with the specified URL
async function run() {
  try {
    console.log('\n========================================');
    console.log(`PROPERTY SCRAPER TEST`);
    console.log(`Scraper: ${scraper.useFirecrawl ? 'Firecrawl' : 'RoboRabbit'}`);
    console.log(`URL: ${propertyUrl}`);
    console.log('========================================\n');
    
    // Start the scrape
    const propertyData = await scraper.scrapeRightmoveProperty(propertyUrl);
    
    if (!propertyData) {
      console.error('No property data returned!');
      return;
    }
    
    // Calculate time taken
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nScraping completed in ${duration} seconds.`);
    
    // Display property data summary
    console.log('\n========================================');
    console.log('PROPERTY INFORMATION SUMMARY');
    console.log('========================================');
    console.log(`Property Address: ${propertyData.raw.property.address}`);
    console.log(`Price: ${propertyData.raw.property.price}`);
    console.log(`Configuration: ${propertyData.raw.property.bedrooms} bedrooms, ${propertyData.raw.property.bathrooms} bathrooms`);
    console.log(`Size: ${propertyData.raw.property.square_ft || 'Not specified'} sq ft`);
    console.log(`Images: ${propertyData.raw.property.allImages.length} images available`);
    console.log(`Estate Agent: ${propertyData.raw.agent.name}`);
    
    // Display key features if available
    if (propertyData.raw.property.keyFeatures && propertyData.raw.property.keyFeatures.length > 0) {
      console.log('\nKey Features:');
      propertyData.raw.property.keyFeatures.forEach((feature, index) => {
        console.log(`  ${index + 1}. ${feature}`);
      });
    }
    
    // Show a portion of the description
    if (propertyData.raw.property.description) {
      console.log('\nDescription (excerpt):');
      console.log(propertyData.raw.property.description.substring(0, 300) + '...');
    }
    
    // Show an excerpt of the generated caption
    console.log('\nGenerated Caption (excerpt):');
    if (propertyData.caption) {
      console.log(propertyData.caption.substring(0, 300) + '...');
      console.log(`\nFull caption length: ${propertyData.caption.length} characters`);
    } else {
      console.log('No caption generated.');
    }
    
    console.log('\n========================================');
    console.log('To generate Bannerbear images, run:');
    console.log(`node scraper.js ${propertyUrl}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

// Execute the scraper
run(); 