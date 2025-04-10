/**
 * Unified scraper interface that routes to the appropriate specialized scraper
 * based on the URL pattern.
 */
require('dotenv').config();
const getConfig = require('next/config').default;

// Create a detailed environment report to log
const envReport = {
  timestamp: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV,
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  envVars: {
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || 'not set',
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ? 'Present (prefix: ' + process.env.FIRECRAWL_API_KEY.substring(0, 5) + '...)' : 'Missing',
    NEXT_PUBLIC_FIRECRAWL_API_KEY: process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY ? 'Present (prefix: ' + process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY.substring(0, 5) + '...)' : 'Missing',
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY ? 'Present' : 'Missing',
  }
};

console.log('SCRAPER.JS ENVIRONMENT REPORT:', JSON.stringify(envReport, null, 2));

// Import specialized scrapers
const rightmoveScraper = require('./firecrawl-rightmove-scraper');
const zillowScraper = require('./firecrawl-zillow-scraper');

// Add a console log to ensure scrapers are loaded
console.log('Scraper modules loaded:', {
  rightmove: typeof rightmoveScraper === 'object' ? `Found with ${Object.keys(rightmoveScraper).length} exports` : 'Not found',
  zillow: typeof zillowScraper === 'object' ? `Found with ${Object.keys(zillowScraper).length} exports` : 'Not found'
});

// Log the exported functions from the rightmove scraper
if (typeof rightmoveScraper === 'object') {
  console.log('Rightmove scraper exports:', Object.keys(rightmoveScraper));
  if (typeof rightmoveScraper.scrapeRightmoveProperty === 'function') {
    console.log('scrapeRightmoveProperty is a function');
  } else {
    console.error('WARNING: scrapeRightmoveProperty is NOT a function!');
  }
}

const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    USE_FIRECRAWL: process.env.USE_FIRECRAWL === 'true',
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY,
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY
  }
};

// Log the serverRuntimeConfig for debugging
console.log('serverRuntimeConfig from scraper.js:', 
  serverRuntimeConfig ? {
    USE_FIRECRAWL: serverRuntimeConfig.USE_FIRECRAWL,
    FIRECRAWL_API_KEY: serverRuntimeConfig.FIRECRAWL_API_KEY ? 'Present (prefix: ' + serverRuntimeConfig.FIRECRAWL_API_KEY.substring(0, 5) + '...)' : 'Missing',
    ROBORABBIT_API_KEY: serverRuntimeConfig.ROBORABBIT_API_KEY ? 'Present' : 'Missing'
  } : 'Not available'
);

// Determine if we should use Firecrawl
const useFirecrawl = serverRuntimeConfig.USE_FIRECRAWL === true 
                   || process.env.USE_FIRECRAWL === 'true';

console.log('useFirecrawl decision:', useFirecrawl, 
  '(serverRuntimeConfig.USE_FIRECRAWL =', serverRuntimeConfig.USE_FIRECRAWL, 
  ', process.env.USE_FIRECRAWL =', process.env.USE_FIRECRAWL, ')');

// URL pattern detection
const RIGHTMOVE_URL_PATTERN = /^https:\/\/(?:www\.)?rightmove\.co\.uk\/properties\/\d+(?:#.*)?$/;
const ZILLOW_URL_PATTERN = /^https:\/\/(?:www\.)?zillow\.com\/(?:[^\/]+\/)*.*$/;

/**
 * Determine the appropriate scraper based on the URL pattern
 * @param {string} url - The property URL to scrape
 * @returns {object} The appropriate scraper module
 */
function getScraper(url) {
  if (RIGHTMOVE_URL_PATTERN.test(url)) {
    console.log('URL matched Rightmove pattern');
    return rightmoveScraper;
  } else if (ZILLOW_URL_PATTERN.test(url)) {
    console.log('URL matched Zillow pattern');
    return zillowScraper;
  } else {
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
    console.log('SCRAPER.JS: Starting scrape of URL:', propertyUrl);
    
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
      if (typeof scraper.scrapeZillowProperty !== 'function') {
        throw new Error('scrapeZillowProperty is not a function in the zillow scraper module');
      }
      console.log('Calling scraper.scrapeZillowProperty()');
      return await scraper.scrapeZillowProperty(propertyUrl);
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