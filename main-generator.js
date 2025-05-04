// main-generator.js - Orchestrates scraping and video generation
console.log('--- Script Starting --- ');

// --- Keep all imports commented out initially ---
/*
const { generateVideoFromData } = require('./generate-shotstack-video');
const { scrapeRightmoveProperty } = require('./firecrawl-rightmove-scraper');
const { scrapeZillowProperty } = require('./firecrawl-zillow-scraper');
const { scrapeOnTheMarketProperty } = require('./firecrawl-onthemarket-scraper');
*/

// --- Helper Functions ---
function getWebsiteType(url) {
  console.log('--- getWebsiteType called ---');
  if (!url) return null;
  if (url.includes('rightmove.co.uk')) return 'rightmove';
  if (url.includes('zillow.com')) return 'zillow';
  if (url.includes('onthemarket.com')) return 'onthemarket';
  if (url.includes('realtor.com')) return 'realtor';
  return null;
}

async function getScraperFunction(websiteType) {
  console.log(`--- getScraperFunction called for: ${websiteType} ---`);
  // Use require for all scrapers (all are now CommonJS)
  try {
    switch (websiteType) {
      case 'rightmove':
        console.log('--- Requiring rightmove scraper ---');
        const { scrapeRightmoveProperty } = require('./firecrawl-rightmove-scraper');
        console.log('--- SUCCESS: Imported scrapeRightmoveProperty ---');
        return scrapeRightmoveProperty;
      case 'zillow':
        console.log('--- Requiring zillow scraper ---');
        const { scrapeZillowProperty } = require('./firecrawl-zillow-scraper');
        console.log('--- SUCCESS: Imported scrapeZillowProperty ---');
        return scrapeZillowProperty;
      case 'onthemarket':
        console.log('--- Requiring onthemarket scraper (CJS) ---');
        const { scrapeOnTheMarketProperty } = require('./firecrawl-onthemarket-scraper.cjs');
        console.log('--- SUCCESS: Imported scrapeOnTheMarketProperty ---');
        return scrapeOnTheMarketProperty;
      case 'realtor':
        console.log('--- Requiring realtor scraper ---');
        const { scrapeRealtorProperty } = require('./firecrawl-realtor-scraper');
        console.log('--- SUCCESS: Imported scrapeRealtorProperty ---');
        return scrapeRealtorProperty;
      default:
        throw new Error(`Unsupported website type: ${websiteType}`);
    }
  } catch (err) {
    console.error(`--- ERROR importing scraper for ${websiteType}:`, err);
    throw err; // Re-throw after logging
  }
}

// --- Main Orchestration Logic ---
async function run() {
  console.log('--- run() function started ---');
  const args = process.argv.slice(2);
  console.log('--- Command line args:', args);
  if (args.length < 2) {
    console.error('Usage: node main-generator.js <propertyUrl> <listingType>');
    process.exit(1);
  }
  const propertyUrl = args[0];
  const listingType = args[1];

  console.log(`Starting process for URL: ${propertyUrl}`);
  console.log(`Listing Type: ${listingType}`);

  try {
    const websiteType = getWebsiteType(propertyUrl);
    if (!websiteType) {
      throw new Error(`Could not determine website type from URL: ${propertyUrl}`);
    }
    console.log(`Detected website type: ${websiteType}`);

    const scrapeFunction = await getScraperFunction(websiteType);

    console.log(`Scraping data from ${websiteType}...`);
    const scrapeResult = await scrapeFunction(propertyUrl, listingType);
    if (!scrapeResult || !scrapeResult.raw) {
      throw new Error('Scraping failed or returned invalid data.');
    }
    const scrapedData = scrapeResult.raw;
    console.log('Scraping successful.');

    // Dynamically require the Shotstack generator only when needed
    let generateVideoFromData;
    try {
      console.log('--- Requiring Shotstack generator from ./scripts/ ... ---');
      const shotstackGenerator = require('./scripts/generate-shotstack-video');
      generateVideoFromData = shotstackGenerator.generateVideoFromData;
      console.log('--- SUCCESS: Imported generateVideoFromData ---');
    } catch (err) {
      console.error('--- ERROR importing generate-shotstack-video:', err);
      throw err; // Re-throw after logging
    }

    console.log('Generating Shotstack video...');
    const videoUrl = await generateVideoFromData(scrapedData, listingType);
    console.log(`\n✅✅✅ Process complete! Video URL: ${videoUrl}`);

  } catch (error) {
    console.error('\n❌❌❌ An error occurred during the process:');
    console.error(error.message);
    // console.error(error.stack); // Optionally log full stack
    process.exit(1);
  }
}

console.log('--- Script setup complete. Calling run() ---');
run(); 