/**
 * Unified scraper interface that routes to the appropriate specialized scraper
 * based on the URL pattern.
 */
require('dotenv').config();
const getConfig = require('next/config').default;

// Import specialized scrapers
const rightmoveScraper = require('./firecrawl-rightmove-scraper');
const zillowScraper = require('./firecrawl-zillow-scraper');
const onthemarketScraper = require('./firecrawl-onthemarket-scraper');

// Add a console log to ensure scrapers are loaded
console.log('Scraper modules loaded:', {
  rightmove: typeof rightmoveScraper === 'object' ? `Found with ${Object.keys(rightmoveScraper).length} exports` : 'Not found',
  zillow: typeof zillowScraper === 'object' ? `Found with ${Object.keys(zillowScraper).length} exports` : 'Not found',
  onthemarket: typeof onthemarketScraper === 'object' ? `Found with ${Object.keys(onthemarketScraper).length} exports` : 'Not found'
});

// Log exactly what functions are exported by each scraper
console.log('Rightmove scraper exports:', Object.keys(rightmoveScraper));
console.log('Zillow scraper exports:', Object.keys(zillowScraper));
console.log('OnTheMarket scraper exports:', typeof onthemarketScraper === 'object' ? Object.keys(onthemarketScraper) : typeof onthemarketScraper);

const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    USE_FIRECRAWL: process.env.USE_FIRECRAWL === 'true',
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY
  }
};

// Determine if we should use Firecrawl
const useFirecrawl = serverRuntimeConfig.USE_FIRECRAWL === true 
                   || process.env.USE_FIRECRAWL === 'true';

// URL pattern detection
const RIGHTMOVE_URL_PATTERN = /^https:\/\/(?:www\.)?rightmove\.co\.uk\/properties\/\d+(?:#.*)?$/;

// Updated Zillow pattern to explicitly match homedetails URLs as well
const ZILLOW_URL_PATTERN = /^https:\/\/(?:www\.)?zillow\.com\/(?:homedetails\/[^\/]+\/\d+_zpid\/|[^\/]+\/.*)/;

// OnTheMarket pattern
const ONTHEMARKET_URL_PATTERN = /^https:\/\/(?:www\.)?onthemarket\.com\/details\/\d+\/?/;

// Test function for URL patterns
function testUrlPatterns() {
  const testUrls = [
    'https://www.zillow.com/homedetails/11533-Satire-St-Orlando-FL-32832/337963859_zpid/',
    'https://zillow.com/apartments/orlando-fl/the-addison-on-millennium/9nz37s/',
    'https://www.zillow.com/homedetails/1234-main-st/12345_zpid/',
    'https://www.rightmove.co.uk/properties/141476078'
  ];
  
  console.log('Testing URL patterns:');
  for (const url of testUrls) {
    console.log(`URL: ${url}`);
    console.log(`  Zillow pattern: ${ZILLOW_URL_PATTERN.test(url)}`);
    console.log(`  Rightmove pattern: ${RIGHTMOVE_URL_PATTERN.test(url)}`);
    console.log(`  OnTheMarket pattern: ${ONTHEMARKET_URL_PATTERN.test(url)}`);
  }
}

// Run the test on module load
testUrlPatterns();

/**
 * Determine the appropriate scraper based on the URL pattern
 * @param {string} url - The property URL to scrape
 * @returns {object} The appropriate scraper module
 */
function getScraper(url) {
  // Log the URL being checked for debugging
  console.log('Checking URL pattern for:', url);
  
  if (RIGHTMOVE_URL_PATTERN.test(url)) {
    console.log('URL matched Rightmove pattern');
    return rightmoveScraper;
  } else if (ZILLOW_URL_PATTERN.test(url)) {
    console.log('URL matched Zillow pattern');
    return zillowScraper;
  } else if (ONTHEMARKET_URL_PATTERN.test(url)) {
    console.log('URL matched OnTheMarket pattern');
    return onthemarketScraper;
  } else {
    // Log more debug info when no match is found
    console.error('No pattern match found for URL:', url);
    console.error('Rightmove pattern test:', RIGHTMOVE_URL_PATTERN.test(url));
    console.error('Zillow pattern test:', ZILLOW_URL_PATTERN.test(url));
    console.error('OnTheMarket pattern test:', ONTHEMARKET_URL_PATTERN.test(url));
    throw new Error(`Unsupported URL pattern: ${url}`);
  }
}

/**
 * Scrape property data from a URL, automatically routing to the right scraper
 * @param {string} propertyUrl - The URL to scrape
 * @returns {Promise<object>} The scraped property data
 */
async function scrapeProperty(propertyUrl) {
  console.log(`Scraping property data from: ${propertyUrl}`);
  
  try {
    // Get the appropriate scraper for this URL
    const scraper = getScraper(propertyUrl);
    
    // Explicitly log available functions in the scraper
    console.log('Available functions in scraper:', Object.keys(scraper));
    
    // Call the specialized scraper function with explicit error handling
    if (RIGHTMOVE_URL_PATTERN.test(propertyUrl)) {
      if (typeof scraper.scrapeRightmoveProperty !== 'function') {
        throw new Error('scrapeRightmoveProperty is not a function in the rightmove scraper module');
      }
      console.log('Calling scraper.scrapeRightmoveProperty()');
      return await scraper.scrapeRightmoveProperty(propertyUrl);
    } else if (ZILLOW_URL_PATTERN.test(propertyUrl)) {
      console.log('Detected Zillow URL pattern. Checking for scrapeZillowProperty function...');
      
      if (typeof scraper.scrapeZillowProperty !== 'function') {
        console.error('Available properties on Zillow scraper:', Object.getOwnPropertyNames(scraper));
        console.error('scrapeZillowProperty exists?', 'scrapeZillowProperty' in scraper);
        console.error('scrapeZillowProperty type:', typeof scraper.scrapeZillowProperty);
        throw new Error('scrapeZillowProperty is not a function in the zillow scraper module');
      }
      
      console.log('Calling scraper.scrapeZillowProperty()');
      try {
        const result = await scraper.scrapeZillowProperty(propertyUrl);
        console.log('scrapeZillowProperty completed successfully', result ? 'with data' : 'no data returned');
        return result;
      } catch (zillowError) {
        console.error('Error in scrapeZillowProperty:', zillowError);
        throw zillowError;
      }
    } else if (ONTHEMARKET_URL_PATTERN.test(propertyUrl)) {
      if (typeof scraper === 'function' || typeof scraper.default === 'function') {
        console.log('Calling OnTheMarket scraper (default export)');
        return await (scraper.default || scraper)(propertyUrl);
      } else if (typeof scraper.scrapeOnTheMarketProperty === 'function') {
        console.log('Calling scraper.scrapeOnTheMarketProperty()');
        return await scraper.scrapeOnTheMarketProperty(propertyUrl);
      } else {
        throw new Error('No valid function found in OnTheMarket scraper module');
      }
    } else {
      throw new Error(`No scraper implementation found for URL: ${propertyUrl}`);
    }
  } catch (error) {
    console.error('Error in scrapeProperty:', error);
    throw error;
  }
}

/**
 * Generate a Bannerbear image from property data
 * @param {object} propertyData - The property data
 * @returns {Promise<object>} The Bannerbear response
 */
async function generateBannerbearImage(propertyData) {
  // Determine which scraper to use based on the metadata
  const source = propertyData.bannerbear.metadata.source;
  if (source === 'rightmove') {
    return await rightmoveScraper.generateBannerbearImage(propertyData);
  } else if (source === 'zillow') {
    return await zillowScraper.generateBannerbearImage(propertyData);
  } else if (source === 'onthemarket') {
    return await onthemarketScraper.generateBannerbearImage(propertyData);
  } else {
    throw new Error(`Unknown property source: ${source}`);
  }
}

/**
 * Generate a Bannerbear collection from property data
 * @param {object} propertyData - The property data
 * @param {string} templateSetUid - The Bannerbear template set UID
 * @returns {Promise<object>} The Bannerbear response
 */
async function generateBannerbearCollection(propertyData, templateSetUid) {
  // Determine which scraper to use based on the metadata
  const source = propertyData.bannerbear.metadata.source;
  if (source === 'rightmove') {
    return await rightmoveScraper.generateBannerbearCollection(propertyData, templateSetUid);
  } else if (source === 'zillow') {
    return await zillowScraper.generateBannerbearCollection(propertyData, templateSetUid);
  } else if (source === 'onthemarket') {
    return await onthemarketScraper.generateBannerbearCollection(propertyData, templateSetUid);
  } else {
    throw new Error(`Unknown property source: ${source}`);
  }
}

/**
 * Process a Bannerbear webhook response
 * @param {object} webhookData - The webhook data from Bannerbear
 * @returns {object} The processed webhook data
 */
function processBannerbearWebhook(webhookData) {
  // The webhook processing is the same regardless of source
  if (webhookData.template_set) {
    // This is a collection response
    return {
      type: 'collection',
      status: webhookData.status,
      images: webhookData.images,
      image_urls: webhookData.image_urls,
      template_set: webhookData.template_set,
      metadata: webhookData.metadata,
      source: webhookData.metadata?.source
    };
  } else {
    // This is a single image response
    return {
      type: 'single',
      status: webhookData.status,
      image_url: webhookData.image_url,
      image_url_png: webhookData.image_url_png,
      image_url_jpg: webhookData.image_url_jpg,
      template: webhookData.template,
      metadata: webhookData.metadata,
      source: webhookData.metadata?.source
    };
  }
}

// Simple function to test the scraper selection
async function testScraper() {
  const url = process.argv[2];
  if (!url) {
    console.error('Please provide a URL to test');
    console.log('Usage: node scraper.js <URL>');
    process.exit(1);
  }
  
  try {
    console.log(`Testing scraper for URL: ${url}`);
    const propertyData = await scrapeProperty(url);
    console.log('Successfully scraped property data!');
    
    // Use template set generation by default if available
    const templateSetUid = serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID 
                        || process.env.BANNERBEAR_TEMPLATE_SET_UID;
    
    if (!templateSetUid) {
      console.log('No template set UID configured, using single template generation...');
      const bannerbearResponse = await generateBannerbearImage(propertyData);
      console.log('Image generation initiated!');
      console.log('Image UID for tracking:', bannerbearResponse.uid);
      return;
    }
    
    console.log('Generating collection using template set:', templateSetUid);
    const collectionResponse = await generateBannerbearCollection(propertyData, templateSetUid);
    
    console.log('Collection generation initiated!');
    console.log('Collection UID for tracking:', collectionResponse.uid);
  } catch (error) {
    console.error('Error testing scraper:', error);
  }
}

// Export functions
module.exports = {
  scrapeProperty,
  generateBannerbearImage,
  generateBannerbearCollection,
  processBannerbearWebhook,
  testScraper,
  useFirecrawl
};

// Run the test if this file is executed directly
if (require.main === module) {
  testScraper();
} 