// firecrawl-rightmove-scraper.js - Specialized scraper for Rightmove properties

require('dotenv').config();
const fetch = require('node-fetch');
const { generatePropertyCaptions, CAPTION_TYPES } = require('../caption-generator');
const getConfig = require('next/config').default;
const configService = require('./config-service');

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

// Debug logging for configuration
console.log('Configuration sources:');
console.log('process.env.FIRECRAWL_API_KEY:', process.env.FIRECRAWL_API_KEY ? 'Present' : 'Missing');
console.log('serverRuntimeConfig:', serverRuntimeConfig ? 'Present' : 'Missing');
console.log('serverRuntimeConfig.FIRECRAWL_API_KEY:', serverRuntimeConfig?.FIRECRAWL_API_KEY ? 'Present' : 'Missing');

// Try multiple sources for the API key
const FIRECRAWL_API_KEY = serverRuntimeConfig?.FIRECRAWL_API_KEY || 
                         process.env.FIRECRAWL_API_KEY || 
                         process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;

// Log more detailed API key information
console.log('API Key sources:');
console.log('- serverRuntimeConfig?.FIRECRAWL_API_KEY:', serverRuntimeConfig?.FIRECRAWL_API_KEY ? 'Present' : 'Missing');
console.log('- process.env.FIRECRAWL_API_KEY:', process.env.FIRECRAWL_API_KEY ? 'Present' : 'Missing');
console.log('- process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY:', process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY ? 'Present' : 'Missing');
console.log('Final FIRECRAWL_API_KEY status:', FIRECRAWL_API_KEY ? 'Found' : 'Missing');
console.log('API Key prefix:', FIRECRAWL_API_KEY ? FIRECRAWL_API_KEY.substring(0, 5) : 'N/A');

if (!FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY is missing. Please ensure it is properly configured in environment variables.');
    throw new Error('FIRECRAWL_API_KEY is not configured. Please add it to your environment variables.');
}

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

async function getFirecrawlApiKey() {
    try {
        const key = await configService.getFirecrawlApiKey();
        console.log('API Key status:', {
            keyExists: !!key,
            keyPrefix: key ? key.substring(0, 5) : 'N/A'
        });
        return key;
    } catch (error) {
        console.error('Failed to retrieve Firecrawl API key:', error);
        throw error;
    }
}

async function scrapeRightmoveProperty(propertyUrl) {
    console.log(`Starting scrape for: ${propertyUrl}`);

    try {
        // Get the API key first
        const apiKey = await getFirecrawlApiKey();
        console.log('Successfully retrieved Firecrawl API key');

        // Create a detailed environment report
        const envReport = {
            timestamp: new Date().toISOString(),
            nodeEnv: process.env.NODE_ENV,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memoryUsage: process.memoryUsage(),
            apiKeyStatus: {
                exists: !!apiKey,
                keyPrefix: apiKey ? apiKey.substring(0, 5) : 'N/A'
            }
        };

        // First try using the FirecrawlApp package if available
        if (FirecrawlApp) {
            try {
                return await scrapeWithFirecrawlPackage(propertyUrl, apiKey);
            } catch (packageError) {
                console.warn('Failed to use FirecrawlApp package, falling back to direct API:', packageError.message);
            }
        }

        // Validate and clean the URL
        validateRightmoveUrl(propertyUrl);
        const cleanUrl = cleanRightmoveUrl(propertyUrl);
        
        console.log('----- SCRAPE ATTEMPT INFO -----');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Clean URL:', cleanUrl);
        console.log('API Key status:', envReport.apiKeyStatus);
        console.log('-------------------------------');
        
        // Try to scrape with Firecrawl
        try {
            console.log('Attempting to scrape with Firecrawl...');
            return await scrapeWithFirecrawl(cleanUrl, apiKey, envReport);
        } catch (firecrawlError) {
            console.error('DETAILED ERROR REPORT:', JSON.stringify({
                ...envReport,
                error: {
                    message: firecrawlError.message,
                    stack: firecrawlError.stack,
                    name: firecrawlError.name,
                    code: firecrawlError.code
                }
            }, null, 2));
            throw firecrawlError;
        }
    } catch (error) {
        console.error('Error in scrapeRightmoveProperty:', error);
        throw error;
    }
}

// Firecrawl-specific scraping function
async function scrapeWithFirecrawl(cleanUrl, apiKey, envReport) {
    const prompt = "Capture the price, address, number of bedrooms, bathrooms, and square ft of the property. Include the name, address, and logo of the estate agent. Capture the property description, key features, and all gallery images";

    for (let mainAttempt = 1; mainAttempt <= 3; mainAttempt++) {
        try {
            console.log(`Firecrawl extraction attempt ${mainAttempt}/3`);
            
            const requestBody = {
                urls: [cleanUrl],
                prompt: prompt
            };
            
            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                    'User-Agent': 'TrofaiApp/1.0'
                },
                body: JSON.stringify(requestBody)
            };
            
            console.log('Making request to Firecrawl API...');
            const requestInfo = {
                url: 'https://api.firecrawl.dev/v1/extract',
                method: requestOptions.method,
                headers: { ...requestOptions.headers, Authorization: '[REDACTED]' },
                bodyLength: JSON.stringify(requestBody).length
            };
            console.log('Request details:', JSON.stringify(requestInfo, null, 2));
            
            const response = await fetch('https://api.firecrawl.dev/v1/extract', requestOptions);
            
            console.log('Response status:', response.status);
            console.log('Response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
            
            // First get the response as text
            const responseText = await response.text();
            console.log('Raw API Response (first 200 chars):', responseText.substring(0, 200));
            
            // If response is HTML, create detailed error
            if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
                responseText.trim().toLowerCase().startsWith('<html')) {
                console.error('Received HTML response instead of JSON. This usually indicates an authentication error.');
                
                const htmlError = {
                    type: 'HTMLResponse',
                    status: response.status,
                    headers: Object.fromEntries([...response.headers]),
                    responsePreview: responseText.substring(0, 500),
                    requestDetails: requestInfo,
                    environment: envReport,
                    timestamp: new Date().toISOString()
                };
                
                console.error('HTML ERROR DETAILS:', JSON.stringify(htmlError, null, 2));
                throw new Error(`Authentication error: API returned HTML instead of JSON. Status: ${response.status}. Please check your API key. Environment: ${JSON.stringify(envReport.apiKeyStatus)}`);
            }
            
            // Try to parse as JSON
            let jsonData;
            try {
                jsonData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                
                const jsonError = {
                    type: 'JSONParseError',
                    parseError: {
                        message: parseError.message,
                        stack: parseError.stack
                    },
                    responsePreview: responseText.substring(0, 500),
                    status: response.status,
                    headers: Object.fromEntries([...response.headers]),
                    requestDetails: requestInfo,
                    environment: envReport,
                    timestamp: new Date().toISOString()
                };
                
                console.error('JSON PARSE ERROR DETAILS:', JSON.stringify(jsonError, null, 2));
                throw new Error(`Invalid JSON response. Raw response: ${responseText.substring(0, 200)}... Environment: ${JSON.stringify(envReport.apiKeyStatus)}`);
            }
            
            if (!response.ok) {
                const errorMessage = jsonData.error || jsonData.message || 'Unknown error';
                
                const apiError = {
                    type: 'APIError',
                    status: response.status,
                    errorMessage,
                    responseData: jsonData,
                    headers: Object.fromEntries([...response.headers]),
                    requestDetails: requestInfo,
                    environment: envReport,
                    timestamp: new Date().toISOString()
                };
                
                console.error('API ERROR DETAILS:', JSON.stringify(apiError, null, 2));
                throw new Error(`Firecrawl API error (${response.status}): ${errorMessage}. Environment: ${JSON.stringify(envReport.apiKeyStatus)}`);
            }
            
            // Check if we got an immediate response or need to poll
            if (jsonData.data && jsonData.data.length > 0) {
                console.log('Got immediate data response');
                return await processFirecrawlResults(jsonData.data[0]);
            } else if (jsonData.id) {
                console.log(`Firecrawl extraction initiated with ID: ${jsonData.id}`);
                const pollResult = await pollFirecrawlResults(jsonData.id, apiKey, envReport);
                
                console.log('Poll result received');
                return await processFirecrawlResults(pollResult);
            } else {
                throw new Error('Unexpected response format from Firecrawl');
            }
        } catch (error) {
            if (mainAttempt === 3) throw error;
            console.log(`Attempt ${mainAttempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function pollFirecrawlResults(extractId, apiKey, envReport) {
    let attempts = 0;

    const poll = async () => {
        if (attempts >= MAX_POLLING_ATTEMPTS) {
            const timeoutError = {
                type: 'PollingTimeout',
                attempts: MAX_POLLING_ATTEMPTS,
                extractId,
                environment: envReport,
                timestamp: new Date().toISOString()
            };
            console.error('POLLING TIMEOUT ERROR:', JSON.stringify(timeoutError, null, 2));
            throw new Error(`Max polling attempts (${MAX_POLLING_ATTEMPTS}) reached. Environment: ${JSON.stringify(envReport?.apiKeyStatus)}`);
        }

        attempts++;
        console.log(`Polling Firecrawl attempt ${attempts}...`);

        // Retry each poll request up to 3 times with short delays
        let pollError = null;
        for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
            try {
                console.log(`Poll retry attempt ${retryAttempt + 1}/3`);
                const requestOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'application/json'
                    }
                };
                console.log('Poll request headers:', JSON.stringify({ ...requestOptions.headers, Authorization: '[REDACTED]' }, null, 2));
                
                const pollUrl = `https://api.firecrawl.dev/v1/extract/${extractId}`;
                console.log('Polling URL:', pollUrl);

                const response = await fetch(pollUrl, requestOptions);
                console.log('Poll response status:', response.status);
                console.log('Poll response headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));

                // First get the response as text
                const responseText = await response.text();
                console.log(`Poll attempt ${attempts} raw response preview:`, responseText.substring(0, 200));

                // Check for HTML response
                if (responseText.trim().toLowerCase().startsWith('<!doctype') || 
                    responseText.trim().toLowerCase().startsWith('<html')) {
                    console.error('Received HTML response instead of JSON during polling. This usually indicates an authentication error.');
                    
                    const htmlError = {
                        type: 'PollingHTMLResponse',
                        status: response.status,
                        extractId,
                        attempt: attempts,
                        retryAttempt,
                        headers: Object.fromEntries([...response.headers]),
                        responsePreview: responseText.substring(0, 500),
                        environment: envReport,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.error('POLLING HTML ERROR DETAILS:', JSON.stringify(htmlError, null, 2));
                    throw new Error(`Authentication error: API returned HTML instead of JSON during polling. Status: ${response.status}. Environment: ${JSON.stringify(envReport?.apiKeyStatus)}`);
                }

                // Try to parse as JSON
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse polling response as JSON:', parseError);
                    
                    const jsonError = {
                        type: 'PollingJSONParseError',
                        extractId,
                        attempt: attempts,
                        retryAttempt,
                        parseError: {
                            message: parseError.message,
                            stack: parseError.stack
                        },
                        responsePreview: responseText.substring(0, 500),
                        status: response.status,
                        headers: Object.fromEntries([...response.headers]),
                        environment: envReport,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.error('POLLING JSON PARSE ERROR DETAILS:', JSON.stringify(jsonError, null, 2));
                    throw new Error(`Invalid JSON response from polling. Raw response: ${responseText.substring(0, 200)}... Environment: ${JSON.stringify(envReport?.apiKeyStatus)}`);
                }

                if (!response.ok) {
                    const errorMessage = data.error || data.message || 'Unknown error';
                    
                    const apiError = {
                        type: 'PollingAPIError',
                        status: response.status,
                        extractId,
                        attempt: attempts,
                        retryAttempt,
                        errorMessage,
                        responseData: data,
                        headers: Object.fromEntries([...response.headers]),
                        environment: envReport,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.error('POLLING API ERROR DETAILS:', JSON.stringify(apiError, null, 2));
                    throw new Error(`Failed to poll Firecrawl results (${response.status}): ${errorMessage}. Environment: ${JSON.stringify(envReport?.apiKeyStatus)}`);
                }

                if (data.status === 'completed' && data.data) {
                    console.log('Firecrawl extraction completed!');
                    console.log('Extracted data:', JSON.stringify(data.data, null, 2));
                    return data.data;
                } else if (data.status === 'failed') {
                    const failedError = {
                        type: 'ExtractionFailed',
                        extractId,
                        attempt: attempts,
                        retryAttempt,
                        data,
                        environment: envReport,
                        timestamp: new Date().toISOString()
                    };
                    
                    console.error('EXTRACTION FAILED ERROR:', JSON.stringify(failedError, null, 2));
                    throw new Error(`Firecrawl extraction failed: ${JSON.stringify(data)}. Environment: ${JSON.stringify(envReport?.apiKeyStatus)}`);
                }

                // If still processing, continue to next poll attempt
                console.log(`Status: ${data.status}, continuing polling...`);
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
        // Get Bannerbear credentials from Parameter Store
        const apiKey = await configService.getBannerbearApiKey();
        const webhookUrl = await configService.getParameter('BANNERBEAR_WEBHOOK_URL');
        const webhookSecret = await configService.getParameter('BANNERBEAR_WEBHOOK_SECRET');
        const projectId = await configService.getParameter('BANNERBEAR_PROJECT_ID');

        const bannerbearPayload = {
            ...propertyData.bannerbear,
            project_id: projectId || 'E56OLrMKYWnzwl3oQj'
        };

        // Add webhook configuration
        if (webhookUrl) {
            bannerbearPayload.webhook_url = webhookUrl;
            bannerbearPayload.webhook_headers = {
                'Authorization': `Bearer ${webhookSecret}`
            };
        }

        console.log('Sending Bannerbear request with payload:', JSON.stringify(bannerbearPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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
        // Get Bannerbear credentials from all possible sources
        const apiKey = await configService.getBannerbearApiKey();
        const webhookUrl = await configService.getBannerbearWebhookUrl();
        const webhookSecret = await configService.getBannerbearWebhookSecret();
        const projectId = await configService.getBannerbearProjectId();

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
        const imageModifications = [];
        for (let i = 0; i <= 23; i++) {
            const layerName = i === 0 ? "property_image" : `property_image${i}`;
            // Use modulo to cycle through available images
            const imageIndex = i % propertyImages.length;
            
            imageModifications.push({
                name: layerName,
                image_url: propertyImages[imageIndex]
            });
        }

        // Prepare the collection payload
        const collectionPayload = {
            template_set: templateSetUid,
            modifications: [...baseModifications, ...imageModifications],
            project_id: projectId,
            metadata: {
                source: "rightmove",
                scraped_at: new Date().toISOString(),
                total_images: propertyImages.length
            }
        };

        // Add webhook configuration if available
        if (webhookUrl) {
            collectionPayload.webhook_url = webhookUrl;
            collectionPayload.webhook_headers = {
                'Authorization': `Bearer ${webhookSecret}`
            };
        }

        console.log('Sending Bannerbear collection request with payload:', JSON.stringify(collectionPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/collections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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