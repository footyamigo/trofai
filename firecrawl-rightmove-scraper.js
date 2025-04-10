// firecrawl-rightmove-scraper.js - Specialized scraper for Rightmove properties

require('dotenv').config();
const fetch = require('node-fetch');
const { generatePropertyCaptions, CAPTION_TYPES } = require('./caption-generator');
const getConfig = require('next/config').default;

// Import FirecrawlApp from the package if it exists, otherwise continue with fetch
let FirecrawlApp;
try {
    FirecrawlApp = require('@mendable/firecrawl-js').FirecrawlApp;
    console.log('Successfully imported @mendable/firecrawl-js package');
} catch (error) {
    console.log('FirecrawlApp package not available, will use fetch API approach');
}

const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  }
};

// Constants
const MAX_RETRY_ATTEMPTS = 6;
const RETRY_DELAY_MS = 3000;
const POLLING_INTERVAL_MS = 3000;
const MAX_POLLING_ATTEMPTS = 30;

// Add Bannerbear polling constants
const BANNERBEAR_POLLING_INTERVAL_MS = 1000;
const BANNERBEAR_MAX_POLLING_ATTEMPTS = 30;

// Validation patterns
const RIGHTMOVE_URL_PATTERN = /^https:\/\/(?:www\.)?rightmove\.co\.uk\/properties\/\d+(?:#.*)?$/;

// Error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ScrapingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ScrapingError';
    }
}

// Template configuration for Bannerbear
const BANNERBEAR_TEMPLATE_CONFIG = {
    layers: {
        propertyImage: 'property_image',
        propertyPrice: 'property_price',
        propertyLocation: 'property_location',
        bedrooms: 'bedrooms',
        bedroomIcon: 'bedroom_icon',
        bathrooms: 'bathrooms',
        bathroomIcon: 'bathroom_icon',
        agentLogo: 'logo',
        agentAddress: 'estate_agent_address'
    },
    options: {
        transparent: false,
        render_pdf: false
    }
};

function validateRightmoveUrl(url) {
    if (!url) {
        throw new ValidationError('URL is required');
    }
    if (!RIGHTMOVE_URL_PATTERN.test(url)) {
        throw new ValidationError('Invalid Rightmove property URL format');
    }
    return true;
}

function cleanRightmoveUrl(url) {
    validateRightmoveUrl(url);
    const propertyId = url.split('/properties/')[1].split(/[#?]/)[0];
    return `https://www.rightmove.co.uk/properties/${propertyId}`;
}

function formatAddress(address) {
    if (!address) return null;
    
    // Remove extra whitespace, normalize line endings, and fix multiple commas
    return address
        .replace(/\r\n/g, ',')
        .replace(/,+/g, ',')
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim();
}

function formatPrice(price) {
    if (!price) return null;
    
    // If price is already formatted, return it
    if (typeof price === 'string' && price.startsWith('£')) {
        return price;
    }
    
    // Remove any existing currency symbols and commas
    const cleanPrice = String(price).replace(/[£,]/g, '').trim();
    
    // Extract numeric value and period (pcm, pw)
    const matches = cleanPrice.match(/^(\d+(?:\.\d+)?)\s*(pcm|pw)?$/i);
    if (!matches) return price; // Return original if format not recognized

    const [_, amount, period] = matches;
    const numericAmount = parseFloat(amount);

    // Format with currency symbol and commas, but without decimals
    const formattedAmount = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);

    return `${formattedAmount} ${period || ''}`.trim();
}

async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Retry attempt ${attempt}/${maxAttempts}`);
            return await fn();
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);
            
            if (attempt === maxAttempts) {
                console.error(`All ${maxAttempts} retry attempts failed`);
                break;
            }
            
            const delay = RETRY_DELAY_MS * Math.pow(1.5, attempt - 1);
            console.log(`Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

async function scrapeRightmoveProperty(propertyUrl) {
    console.log(`Starting scrape for: ${propertyUrl}`);

    try {
        // First try using the FirecrawlApp package if available
        if (FirecrawlApp) {
            try {
                return await scrapeWithFirecrawlPackage(propertyUrl);
            } catch (packageError) {
                console.warn('Failed to use FirecrawlApp package, falling back to direct API:', packageError.message);
            }
        }

        validateRightmoveUrl(propertyUrl);
        const cleanUrl = cleanRightmoveUrl(propertyUrl);
        
        // Define the prompt for data extraction - use the same prompt from the playground
        const prompt = "Capture the price, address, number of bedrooms, bathrooms, and square ft of the property. Include the name, address, and logo of the estate agent. Capture the property description, key features, and all gallery images";

        // Retry the entire extraction process multiple times if needed
        let lastError = null;
        for (let mainAttempt = 1; mainAttempt <= 3; mainAttempt++) {
            try {
                console.log(`Main extraction attempt ${mainAttempt}/3`);
                console.log('Sending request to Firecrawl with prompt-only extraction');
                
                const extractData = await retryWithBackoff(async () => {
                    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
                        },
                        body: JSON.stringify({
                            urls: [cleanUrl],
                            prompt: prompt
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new ScrapingError(`Firecrawl API error: ${response.status} - ${JSON.stringify(errorData)}`);
                    }

                    return response.json();
                });

                console.log('Firecrawl API Response:', JSON.stringify(extractData, null, 2));

                // Check if the extraction was successful
                if (!extractData.success) {
                    throw new ScrapingError(`Error from Firecrawl: ${extractData.message || 'Unknown error'}`);
                }

                // Check if we got an immediate response or need to poll
                if (extractData.data && extractData.data.length > 0) {
                    // Process immediate data response
                    console.log('Got immediate data response');
                    return await processFirecrawlResults(extractData.data[0]);
                } else if (extractData.id) {
                    // If it's an async job, poll for results
                    console.log(`Firecrawl extraction initiated with ID: ${extractData.id}`);
                    const pollResult = await pollFirecrawlResults(extractData.id);
                    
                    console.log('Poll result received:', JSON.stringify(pollResult, null, 2));
                    
                    // Check if we got any data
                    if (pollResult) {
                        // Handle different response formats
                        if (Array.isArray(pollResult) && pollResult.length > 0) {
                            return await processFirecrawlResults(pollResult[0]);
                        } else if (typeof pollResult === 'object' && (pollResult.property || pollResult.estate_agent)) {
                            // This is likely the object itself, not an array
                            return await processFirecrawlResults(pollResult);
                        } else {
                            console.log('No property data in poll result');
                            // Don't throw here, try again in the next main attempt
                            lastError = new ScrapingError('No property data in poll result');
                            continue;
                        }
                    } else {
                        console.log('No valid data in poll result');
                        // Don't throw here, try again in the next main attempt
                        lastError = new ScrapingError('No valid data in poll result');
                        continue;
                    }
                } else {
                    lastError = new ScrapingError('Unexpected response format from Firecrawl');
                    continue;
                }
            } catch (error) {
                lastError = error;
                console.warn(`Firecrawl API attempt ${mainAttempt}/3 failed:`, error.message);
                
                // Add a delay before retrying
                if (mainAttempt < 3) {
                    const delay = 5000 * mainAttempt; // Increase delay with each attempt
                    console.log(`Waiting ${delay}ms before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
            
        // If all attempts failed, throw an error instead of using sample data
        console.error('All Firecrawl API attempts failed:', lastError?.message);
        throw new Error(`Failed to scrape property after multiple attempts: ${lastError?.message}`);
    } catch (error) {
        if (error instanceof ValidationError || error instanceof ScrapingError) {
            console.error(`${error.name}:`, error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}

/**
 * Scrape Rightmove property data using the FirecrawlApp package
 * This uses the approach shown in the Firecrawl documentation
 */
async function scrapeWithFirecrawlPackage(propertyUrl) {
    if (!FirecrawlApp) {
        throw new Error('FirecrawlApp package not available');
    }

    console.log(`Scraping with FirecrawlApp package: ${propertyUrl}`);
    validateRightmoveUrl(propertyUrl);
    const cleanUrl = cleanRightmoveUrl(propertyUrl);

    try {
        // Initialize the Firecrawl client
        const app = new FirecrawlApp({
            apiKey: serverRuntimeConfig.FIRECRAWL_API_KEY
        });

        // Define the extraction prompt
        const prompt = "Capture the price, address, number of bedrooms, bathrooms, and square ft of the property. Include the name, address, and logo of the estate agent. Capture the property description, key features, and all gallery images";

        // Extract the data
        const extractResult = await app.extract([cleanUrl], {
            prompt: prompt
        });

        console.log("Extraction result:", JSON.stringify(extractResult, null, 2));

        if (!extractResult.success) {
            throw new ScrapingError(`FirecrawlApp extraction failed: ${extractResult.message || 'Unknown error'}`);
        }

        // Process the first item in the results (there should only be one)
        const data = extractResult.data[0];
        return processFirecrawlResults(data);
    } catch (error) {
        console.error("Error using FirecrawlApp package:", error);
        throw error;
    }
}

async function pollFirecrawlResults(extractId) {
    let attempts = 0;

    const poll = async () => {
        if (attempts >= MAX_POLLING_ATTEMPTS) {
            throw new ScrapingError('Max polling attempts reached');
        }

        attempts++;
        console.log(`Polling Firecrawl attempt ${attempts}...`);

        // Retry each poll request up to 3 times with short delays
        let pollError = null;
        for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
            try {
                const response = await fetch(`https://api.firecrawl.dev/v1/extract/${extractId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`Failed to poll Firecrawl results: ${response.status} - ${errorText}`);
                }

                const data = await response.json();

                if (data.status === 'completed' && data.data) {
                    console.log('Firecrawl extraction completed!');
                    console.log('Extracted data:', JSON.stringify(data.data, null, 2));
                    return data.data;
                } else if (data.status === 'failed') {
                    throw new ScrapingError('Firecrawl extraction failed: ' + JSON.stringify(data));
                }

                // If still processing, continue to next poll attempt
                break;
            } catch (error) {
                pollError = error;
                console.warn(`Poll retry attempt ${retryAttempt + 1}/3 failed:`, error.message);
                
                // Don't retry on the last attempt of the last poll
                if (retryAttempt < 2 || attempts < MAX_POLLING_ATTEMPTS) {
                    const backoffDelay = 1000 * (retryAttempt + 1);
                    console.log(`Waiting ${backoffDelay}ms before retrying poll...`);
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                }
            }
        }

        // If all retry attempts for this poll failed, and it's not the last polling attempt,
        // continue to the next polling attempt after the normal polling interval
        if (pollError && attempts < MAX_POLLING_ATTEMPTS) {
            console.log(`All retry attempts for poll ${attempts} failed, continuing to next poll...`);
        } else if (pollError) {
            // If this was the last polling attempt and all retries failed, throw the error
            throw pollError;
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        return poll();
    };

    return await poll();
}

async function processFirecrawlResults(data) {
    console.log('Processing data:', JSON.stringify(data, null, 2));
    
    // If the data is null or undefined, throw an error
    if (!data) {
        throw new ScrapingError('No data returned from Firecrawl');
    }
    
    // Log the data format to debug
    console.log('Data keys:', Object.keys(data));
    
    // Handle both conventional formats and variations in key names
    // For structured data with property and estate_agent keys
    if (data.property && data.estate_agent) {
        console.log('Data format: property and estate_agent');
        return await processStructuredData(data);
    }
    
    // For data with different key names (camelCase variations)
    if (data.property && data.estateAgent) {
        console.log('Data format: property and estateAgent (camelCase)');
        // Convert to expected format
        const normalizedData = {
            property: data.property,
            estate_agent: data.estateAgent
        };
        return await processStructuredData(normalizedData);
    }
    
    // For unstructured data, try to extract by field mapping
    console.log('Data format: unstructured, attempting to extract fields');
    return await processUnstructuredData(data);
}

async function processStructuredData(data) {
    console.log('Processing structured data with keys:', Object.keys(data.property));
    
    // Normalize the property images field
    // It might be 'images', 'gallery_images', or 'galleryImages'
    let images = [];
    if (data.property.images && Array.isArray(data.property.images)) {
        images = data.property.images;
    } else if (data.property.gallery_images && Array.isArray(data.property.gallery_images)) {
        images = data.property.gallery_images;
    } else if (data.property.galleryImages && Array.isArray(data.property.galleryImages)) {
        images = data.property.galleryImages;
    }
    
    // Normalize square footage field - might be square_ft, squareFt, or squareFeet
    let squareFt = null;
    if (data.property.square_ft) {
        squareFt = data.property.square_ft;
    } else if (data.property.squareFt) {
        squareFt = data.property.squareFt;
    } else if (data.property.squareFeet) {
        squareFt = data.property.squareFeet;
    } else if (data.property.square_footage) {
        squareFt = data.property.square_footage;
    }
    
    // Normalize key features - might be key_features or keyFeatures
    let keyFeatures = [];
    if (data.property.key_features && Array.isArray(data.property.key_features)) {
        keyFeatures = data.property.key_features;
    } else if (data.property.keyFeatures && Array.isArray(data.property.keyFeatures)) {
        keyFeatures = data.property.keyFeatures;
    } else if (data.property.features && Array.isArray(data.property.features)) {
        keyFeatures = data.property.features;
    }
    
    // Format and validate the structured data
    const formattedData = {
        property: {
            address: formatAddress(data.property.address),
            price: formatPrice(data.property.price),
            bedrooms: data.property.bedrooms,
            bathrooms: data.property.bathrooms,
            square_ft: squareFt,
            mainImage: images[0],
            allImages: images,
            keyFeatures: keyFeatures,
            description: data.property.description
        },
        agent: {
            name: data.estate_agent.name,
            address: formatAddress(data.estate_agent.address),
            logo: data.estate_agent.logo,
            about: "" // Firecrawl might not provide agent about info
        }
    };
    
    console.log('Formatted data created successfully');
    return await createOutputData(formattedData);
}

async function processUnstructuredData(data) {
    console.log('Processing unstructured data:', JSON.stringify(data, null, 2));
    
    // Try to find property information in the unstructured data
    let price = null;
    let address = null;
    let bedrooms = null;
    let bathrooms = null;
    let square_ft = null;
    let description = null;
    let key_features = [];
    let images = [];
    let agentName = null;
    let agentAddress = null;
    let agentLogo = null;
    
    // Extract data from possible keys in the response
    if (typeof data === 'object') {
        // Look for price in various possible keys
        price = findValueByPossibleKeys(data, ['price', 'property_price', 'propertyPrice']);
        
        // Look for address
        address = findValueByPossibleKeys(data, ['address', 'property_address', 'propertyAddress', 'location']);
        
        // Look for bedrooms
        const bedroomsValue = findValueByPossibleKeys(data, ['bedrooms', 'bedroom', 'bed', 'beds']);
        if (bedroomsValue !== null) {
            bedrooms = typeof bedroomsValue === 'number' ? bedroomsValue : 
                       parseInt(String(bedroomsValue).match(/\d+/)?.[0] || '0', 10);
        }
        
        // Look for bathrooms
        const bathroomsValue = findValueByPossibleKeys(data, ['bathrooms', 'bathroom', 'bath', 'baths']);
        if (bathroomsValue !== null) {
            bathrooms = typeof bathroomsValue === 'number' ? bathroomsValue : 
                        parseInt(String(bathroomsValue).match(/\d+/)?.[0] || '0', 10);
        }
        
        // Look for square footage
        const sqFtValue = findValueByPossibleKeys(data, ['square_ft', 'square_feet', 'squareFt', 'square_footage', 'size', 'area']);
        if (sqFtValue !== null) {
            square_ft = typeof sqFtValue === 'number' ? sqFtValue : 
                        parseInt(String(sqFtValue).match(/\d+/)?.[0] || '0', 10);
        }
        
        // Look for description
        description = findValueByPossibleKeys(data, ['description', 'property_description', 'propertyDescription']);
        
        // Look for key features
        const featuresValue = findValueByPossibleKeys(data, ['key_features', 'keyFeatures', 'features']);
        if (Array.isArray(featuresValue)) {
            key_features = featuresValue;
        } else if (typeof featuresValue === 'string') {
            // Split string of features by common delimiters
            key_features = featuresValue.split(/[,•\n]+/).map(f => f.trim()).filter(f => f);
        }
        
        // Look for images
        const imagesValue = findValueByPossibleKeys(data, ['images', 'property_images', 'propertyImages', 'image_urls', 'gallery_images', 'galleryImages']);
        if (Array.isArray(imagesValue)) {
            images = imagesValue.filter(img => typeof img === 'string' && img.startsWith('http'));
        }
        
        // Look for agent information
        agentName = findValueByPossibleKeys(data, ['agent_name', 'agentName', 'estate_agent', 'estateAgent', 'estate_agent_name']);
        agentAddress = findValueByPossibleKeys(data, ['agent_address', 'agentAddress', 'estate_agent_address']);
        agentLogo = findValueByPossibleKeys(data, ['agent_logo', 'agentLogo', 'estate_agent_logo', 'logo']);
    }
    
    // If we couldn't extract key data, throw an error
    if (!price && !address && images.length === 0) {
        throw new ScrapingError('Could not extract essential property data from Firecrawl results');
    }
    
    // Create a formatted data object with what we could extract
    const formattedData = {
        property: {
            address: formatAddress(address || 'Unknown address'),
            price: formatPrice(price || 'Unknown price'),
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            square_ft: square_ft,
            mainImage: images[0],
            allImages: images,
            keyFeatures: key_features,
            description: description
        },
        agent: {
            name: agentName || 'Unknown agent',
            address: formatAddress(agentAddress || 'Unknown address'),
            logo: agentLogo,
            about: ""
        }
    };
    
    return await createOutputData(formattedData);
}

// Helper function to find a value by checking multiple possible keys
function findValueByPossibleKeys(obj, possibleKeys) {
    for (const key of possibleKeys) {
        if (obj[key] !== undefined) {
            return obj[key];
        }
    }
    return null;
}

async function createOutputData(formattedData) {
    // Generate captions using existing function
    let caption = null;
    try {
        // Since generatePropertyCaptions returns a Promise, we need to await it
        caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM);
        console.log('Generated caption type:', typeof caption);
        
        // If caption is not a string, convert it or set to a default
        if (caption && typeof caption !== 'string') {
            console.warn('Caption is not a string, converting to string representation');
            caption = String(caption);
        }
        // If caption is still not valid, set a default
        if (!caption) {
            console.warn('Failed to generate caption, using default placeholder');
            caption = `Stunning ${formattedData.property.bedrooms} bedroom property in ${formattedData.property.address} - presented by ${formattedData.agent.name}`;
        }
    } catch (error) {
        console.error('Error generating caption:', error);
        caption = `${formattedData.property.bedrooms} bedroom, ${formattedData.property.bathrooms} bathroom property in ${formattedData.property.address}`;
    }
    
    // Create Bannerbear-ready structure with configurable layers
    const bannerbearData = {
        template: serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID,
        modifications: [
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.propertyImage,
                image_url: formattedData.property.mainImage
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.propertyPrice,
                text: formattedData.property.price
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.propertyLocation,
                text: formattedData.property.address
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.bedrooms,
                text: formattedData.property.bedrooms
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.bathrooms,
                text: formattedData.property.bathrooms
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.agentLogo,
                image_url: formattedData.agent.logo
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.agentAddress,
                text: formattedData.agent.address
            }
        ],
        ...BANNERBEAR_TEMPLATE_CONFIG.options
    };

    if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
        bannerbearData.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
    }

    bannerbearData.metadata = {
        source: "rightmove",
        scraped_at: new Date().toISOString()
    };

    console.log('Formatted Property Data:', JSON.stringify(formattedData, null, 2));
    console.log('Bannerbear-Ready Data:', JSON.stringify(bannerbearData, null, 2));
    
    return {
        raw: formattedData,
        bannerbear: bannerbearData,
        caption: caption
    };
}

async function generateBannerbearImage(propertyData) {
    try {
        const bannerbearPayload = {
            ...propertyData.bannerbear,
            project_id: 'E56OLrMKYWnzwl3oQj'
        };

        // Add webhook configuration
        if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
            bannerbearPayload.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
            bannerbearPayload.webhook_headers = {
                'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
            };
        }

        console.log('Sending Bannerbear request with payload:', JSON.stringify(bannerbearPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bannerbearPayload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Bannerbear API Error:', error);
            throw new Error(`Bannerbear API error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Bannerbear image generation initiated:', result);

        // Return immediately with UID for webhook tracking
        return {
            uid: result.uid,
            status: result.status,
            webhook_url: bannerbearPayload.webhook_url
        };
    } catch (error) {
        console.error('Error generating Bannerbear image:', error);
        throw error;
    }
}

async function generateBannerbearCollection(propertyData, templateSetUid) {
    try {
        // Get all available property images
        const propertyImages = propertyData.raw.property.allImages;
        console.log('Available property images:', propertyImages.length);

        // Create base modifications for common fields
        const baseModifications = [
            {
                name: "property_price",
                text: propertyData.raw.property.price
            },
            {
                name: "property_location",
                text: propertyData.raw.property.address
            },
            {
                name: "bedrooms",
                text: propertyData.raw.property.bedrooms
            },
            {
                name: "bathrooms",
                text: propertyData.raw.property.bathrooms
            },
            {
                name: "logo",
                image_url: propertyData.raw.agent.logo
            },
            {
                name: "estate_agent_address",
                text: propertyData.raw.agent.address
            }
        ];

        // Add image modifications for each template
        // We'll cycle through available images if we have more templates than images
        const imageModifications = [];
        for (let i = 0; i <= 23; i++) {
            const layerName = i === 0 ? "property_image" : `property_image${i}`;
            const imageIndex = i % propertyImages.length; // Cycle through images if we run out
            
            imageModifications.push({
                name: layerName,
                image_url: propertyImages[imageIndex]
            });
        }

        // Prepare the collection payload
        const collectionPayload = {
            template_set: templateSetUid,
            modifications: [...baseModifications, ...imageModifications],
            project_id: 'E56OLrMKYWnzwl3oQj',
            metadata: {
                source: "rightmove",
                scraped_at: new Date().toISOString(),
                propertyId: propertyData.raw.property.id,
                total_images: propertyImages.length
            }
        };

        // Add webhook configuration if available
        if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
            collectionPayload.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
            collectionPayload.webhook_headers = {
                'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET}`
            };
        }

        console.log('Sending Bannerbear collection request with payload:', JSON.stringify(collectionPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/collections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectionPayload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Bannerbear Collection API Error:', error);
            throw new Error(`Bannerbear Collection API error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Bannerbear collection generation initiated:', result);

        // Return collection info for tracking
        return {
            uid: result.uid,
            status: result.status,
            webhook_url: collectionPayload.webhook_url,
            template_set: templateSetUid
        };
    } catch (error) {
        console.error('Error generating Bannerbear collection:', error);
        throw error;
    }
}

// Export functions
module.exports = {
    scrapeRightmoveProperty,
    generateBannerbearImage,
    generateBannerbearCollection
}; 