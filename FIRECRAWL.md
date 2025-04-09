# Firecrawl Integration for Property Data

This document explains how to use the Firecrawl API integration for scraping property data from different real estate websites.

## Overview

We've implemented a scraper system that uses Firecrawl's Extract API to fetch property data from different real estate websites. This implementation offers several advantages:

- No need to create and maintain specific scraping tasks for each website 
- Simpler, more flexible API with better error handling
- Better data normalization with site-specific handling
- Faster extraction with LLM-based approaches

## Files

- `scraper.js` - Main entry point that routes to the appropriate site-specific scraper
- `firecrawl-rightmove-scraper.js` - Specialized scraper for Rightmove
- `firecrawl-zillow-scraper.js` - Specialized scraper for Zillow
- `test-firecrawl.js` - Test script for all scrapers

## Configuration

The integration can be configured via environment variables in the `.env` file:

```
# Scraper Selection
USE_FIRECRAWL=true

# Firecrawl Configuration
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

## Using the Scraper

You can import the main scraper module and use it to extract property data from any supported site:

```javascript
const { scrapeProperty } = require('./scraper');

async function extractPropertyData(propertyUrl) {
  try {
    // The scraper will automatically detect which site-specific scraper to use
    const propertyData = await scrapeProperty(propertyUrl);
    console.log('Property data:', propertyData);
    
    // Use the data with Bannerbear
    const bannerbearData = propertyData.bannerbear;
    // ...
    
    // Access the raw property data
    const rawData = propertyData.raw;
    // ...
    
    // Get the generated caption
    const caption = propertyData.caption;
    // ...
  } catch (error) {
    console.error('Error scraping property:', error);
  }
}

// Extract data from Rightmove
extractPropertyData('https://www.rightmove.co.uk/properties/141476078');

// Extract data from Zillow
extractPropertyData('https://zillow.com/apartments/orlando-fl/the-addison-on-millennium/9nz37s/');
```

## Command Line Testing

You can use the provided command-line tools to test the integration:

```bash
# Test URL detection and automatic router
node scraper.js https://www.rightmove.co.uk/properties/141476078
node scraper.js https://zillow.com/apartments/orlando-fl/the-addison-on-millennium/9nz37s/

# Run comprehensive tests on both supported sites
node test-firecrawl.js

# Test specific site
node test-firecrawl.js https://www.rightmove.co.uk/properties/141476078
node test-firecrawl.js https://zillow.com/apartments/orlando-fl/the-addison-on-millennium/9nz37s/
```

## Supported Sites

### Rightmove

Our Rightmove scraper extracts:

- Property price and address
- Bedrooms, bathrooms, and square footage
- Estate agent details (name, address, logo)
- Property images, description, and key features

### Zillow

Our Zillow scraper extracts:

- Property price and address
- Bedrooms, bathrooms, and square footage
- Management company details
- Property images, description, features, policies, and facts

## Data Structure

The scraper returns data in a standardized structure, regardless of the source:

```javascript
{
  raw: {
    property: {
      address: "Address of the property",
      price: "£999,999", // or $999,999 for US sites
      bedrooms: 3,
      bathrooms: 2,
      square_ft: 1500,
      mainImage: "URL to main image",
      allImages: ["Array of image URLs"],
      keyFeatures: ["Array of key features"],
      description: "Full property description"
      // Additional site-specific fields may be present
    },
    agent: {
      name: "Estate agent/Management company name",
      address: "Agent address",
      logo: "URL to agent logo",
      about: "Information about the agent",
      // Additional site-specific fields may be present
    }
  },
  bannerbear: {
    template: "TEMPLATE_ID",
    modifications: [
      { name: "property_image", image_url: "..." },
      { name: "property_price", text: "..." },
      // Other modifications...
    ],
    webhook_url: "WEBHOOK_URL",
    metadata: {
      source: "rightmove" or "zillow",
      scraped_at: "2023-04-03T12:34:56.789Z"
    }
  },
  caption: "Generated Instagram caption for the property"
}
```

## Error Handling

The scraper includes robust error handling:

- API errors are caught and logged
- A fallback mechanism uses sample data if the API fails
- Site-specific data normalization ensures consistent output format

## Adding New Sites

To add support for a new property site:

1. Create a new file `firecrawl-sitename-scraper.js` following the pattern of existing scrapers
2. Update the URL pattern detection in `scraper.js`
3. Add the new scraper to the imports in `scraper.js`
4. Add site-specific tests in `test-firecrawl.js`

## Dependencies

This integration requires the following dependencies:

```bash
npm install node-fetch @mendable/firecrawl-js dotenv
``` 