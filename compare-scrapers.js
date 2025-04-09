#!/usr/bin/env node
/**
 * Script to compare RoboRabbit and Firecrawl implementations
 * 
 * Usage:
 *   node compare-scrapers.js [URL]
 * 
 * Example:
 *   node compare-scrapers.js https://www.rightmove.co.uk/properties/141476078
 */

require('dotenv').config();
const roboRabbitScraper = require('./test-rightmove');
const firecrawlScraper = require('./firecrawl-scraper');

// Helper to format time in ms to readable format
function formatTime(ms) {
    if (ms < 1000) {
        return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}

// Run a test with a specific scraper and measure performance
async function runTest(name, scraper, url) {
    console.log(`\n=== Testing ${name} ===`);
    console.log(`URL: ${url}`);
    
    const startTime = Date.now();
    try {
        const result = await scraper.scrapeRightmoveProperty(url);
        const elapsed = Date.now() - startTime;
        
        console.log(`✅ SUCCESS - Time: ${formatTime(elapsed)}`);
        
        // Print a summary of the extracted data
        console.log('\nData Summary:');
        console.log(`- Address: ${result.raw.property.address}`);
        console.log(`- Price: ${result.raw.property.price}`);
        console.log(`- Bedrooms: ${result.raw.property.bedrooms}`);
        console.log(`- Bathrooms: ${result.raw.property.bathrooms}`);
        console.log(`- Images: ${result.raw.property.allImages.length}`);
        console.log(`- Description length: ${result.raw.property.description?.length || 0} chars`);
        console.log(`- Caption length: ${result.caption?.length || 0} chars`);
        
        return { 
            success: true,
            time: elapsed,
            data: result
        };
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.log(`❌ FAILED - Time: ${formatTime(elapsed)}`);
        console.log(`Error: ${error.message}`);
        return { 
            success: false,
            time: elapsed,
            error: error.message
        };
    }
}

// Compare both scrapers
async function compareScrapers() {
    // Get URL from command line or use default
    const url = process.argv[2] || 'https://www.rightmove.co.uk/properties/141476078';
    
    console.log('\n==============================================');
    console.log('   COMPARING ROBORABBIT VS FIRECRAWL');
    console.log('==============================================');
    
    // Set env variables for execution
    const originalEnvValue = process.env.USE_FIRECRAWL;
    
    // Run RoboRabbit test
    process.env.USE_FIRECRAWL = 'false';
    const roboRabbitResult = await runTest('RoboRabbit', roboRabbitScraper, url);
    
    // Run Firecrawl test
    process.env.USE_FIRECRAWL = 'true';
    const firecrawlResult = await runTest('Firecrawl', firecrawlScraper, url);
    
    // Restore original env value
    process.env.USE_FIRECRAWL = originalEnvValue;
    
    // Compare results
    console.log('\n==============================================');
    console.log('               COMPARISON RESULTS');
    console.log('==============================================');
    
    console.log('\nPerformance:');
    console.log(`- RoboRabbit: ${formatTime(roboRabbitResult.time)} ${roboRabbitResult.success ? '✅' : '❌'}`);
    console.log(`- Firecrawl:  ${formatTime(firecrawlResult.time)} ${firecrawlResult.success ? '✅' : '❌'}`);
    
    if (roboRabbitResult.success && firecrawlResult.success) {
        const speedDiff = roboRabbitResult.time / firecrawlResult.time;
        const fasterService = speedDiff > 1 ? 'Firecrawl' : 'RoboRabbit';
        console.log(`\n${fasterService} is ${speedDiff > 1 ? speedDiff.toFixed(1) : (1/speedDiff).toFixed(1)}x faster!`);
    }
    
    console.log('\nRecommendation:');
    if (!roboRabbitResult.success && firecrawlResult.success) {
        console.log('✅ Use Firecrawl - RoboRabbit failed but Firecrawl succeeded');
    } else if (roboRabbitResult.success && !firecrawlResult.success) {
        console.log('✅ Use RoboRabbit - Firecrawl failed but RoboRabbit succeeded');
    } else if (!roboRabbitResult.success && !firecrawlResult.success) {
        console.log('❌ Both scrapers failed - Check the URL or implementation');
    } else {
        // Both succeeded, compare performance and data quality
        if (roboRabbitResult.time < firecrawlResult.time * 0.8) {
            console.log('✅ Use RoboRabbit - It is significantly faster');
        } else if (firecrawlResult.time < roboRabbitResult.time * 0.8) {
            console.log('✅ Use Firecrawl - It is significantly faster');
        } else {
            console.log('✅ Use Firecrawl - Similar performance but more flexible and maintainable');
        }
    }
}

// Run the comparison
compareScrapers().catch(error => {
    console.error('Error running comparison:', error);
}); 