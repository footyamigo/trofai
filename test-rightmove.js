require('dotenv').config();
const fetch = require('node-fetch');
const { generatePropertyCaptions, CAPTION_TYPES } = require('./caption-generator');
const getConfig = require('next/config').default;

const { serverRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  }
};

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const POLLING_INTERVAL_MS = 2000;
const MAX_POLLING_ATTEMPTS = 30;

// Add Bannerbear polling constants
const BANNERBEAR_POLLING_INTERVAL_MS = 1000;
const BANNERBEAR_MAX_POLLING_ATTEMPTS = 30;

// Validation patterns
const RIGHTMOVE_URL_PATTERN = /^https:\/\/www\.rightmove\.co\.uk\/properties\/\d+(?:#.*)?$/;

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

// Add this after the require statements
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
    
    // Remove any existing currency symbols and commas
    const cleanPrice = price.replace(/[£,]/g, '').trim();
    
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

function formatPropertyDetails(property) {
    const details = [];
    
    // Add bedrooms and bathrooms
    if (property.bedrooms) details.push(`${property.bedrooms} Bed`);
    if (property.bathrooms) details.push(`${property.bathrooms} Bath`);
    
    // Add property type if available (e.g., "Semi-Detached")
    if (property.propertyType) details.push(property.propertyType);
    
    // Add tenure type if available (e.g., "Freehold")
    if (property.tenure) details.push(property.tenure);
    
    return details.join(' • ');
}

async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt === maxAttempts) break;
            
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

async function scrapeRightmoveProperty(propertyUrl) {
    console.log(`Starting scrape for: ${propertyUrl}`);

    try {
        validateRightmoveUrl(propertyUrl);

        const data = {
            "steps": [
                {
                    "uid": "w1AE6azd8n7dzxWnYp",
                    "action": "go",
                    "config": {
                        "url": propertyUrl
                    }
                }
            ]
        };

        console.log('Request payload:', JSON.stringify(data, null, 2));

        const runData = await retryWithBackoff(async () => {
            const response = await fetch(`https://api.roborabbit.com/v1/tasks/${serverRuntimeConfig.TASK_UID}/runs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serverRuntimeConfig.ROBORABBIT_API_KEY}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new ScrapingError(`Roborabbit API error: ${response.status}`);
            }

            return response.json();
        });

        console.log('API Response:', runData);

        if (runData.message) {
            throw new ScrapingError(`Error from Roborabbit: ${runData.message}`);
        }

        if (runData.uid) {
            const results = await pollForResults(runData.uid);
            return processResults(results);
        }

    } catch (error) {
        if (error instanceof ValidationError || error instanceof ScrapingError) {
            console.error(`${error.name}:`, error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}

async function pollForResults(runUid) {
    let attempts = 0;

    const poll = async () => {
        if (attempts >= MAX_POLLING_ATTEMPTS) {
            throw new ScrapingError('Max polling attempts reached');
        }

        attempts++;
        console.log(`Polling attempt ${attempts}...`);

        const response = await fetch(`https://api.roborabbit.com/v1/tasks/${serverRuntimeConfig.TASK_UID}/runs/${runUid}`, {
            headers: {
                'Authorization': `Bearer ${serverRuntimeConfig.ROBORABBIT_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new ScrapingError(`Failed to poll results: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'finished') {
            console.log('Scraping completed!');
            return data;
        } else if (data.status === 'failed') {
            throw new ScrapingError('Scraping failed: ' + JSON.stringify(data));
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        return poll();
    };

    return await poll();
}

async function processResults(data) {
    if (!data?.outputs?.QD5MJYBw2JgnylL3x6_save_structured_data) {
        throw new ScrapingError('No valid data found in results');
    }

    const propertyData = data.outputs.QD5MJYBw2JgnylL3x6_save_structured_data;
    
    // Format and validate the data
    const formattedData = {
        property: {
            address: formatAddress(propertyData.location_name),
            price: formatPrice(propertyData.price),
            bedrooms: propertyData.bedroom,
            bathrooms: propertyData.bathrooms,
            mainImage: propertyData.property_images?.[0],
            allImages: propertyData.property_images || [],
            keyFeatures: propertyData.key_features,
            description: propertyData.listing_description
        },
        agent: {
            name: propertyData.estate_agent_name,
            address: formatAddress(propertyData.estate_agent_address),
            logo: propertyData.estate_agent_logo,
            about: propertyData.estate_agent_about
        }
    };

    // Generate captions
    const caption = await generatePropertyCaptions(formattedData, CAPTION_TYPES.INSTAGRAM);
    console.log('\nGenerated Instagram Caption:', caption);

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

// Add Bannerbear polling functionality
async function pollBannerbearImage(imageUid) {
    let attempts = 0;

    const poll = async () => {
        if (attempts >= BANNERBEAR_MAX_POLLING_ATTEMPTS) {
            throw new Error('Max polling attempts reached for Bannerbear image');
        }

        attempts++;
        console.log(`Polling Bannerbear attempt ${attempts}...`);

        try {
            const response = await fetch(`https://api.bannerbear.com/v2/images/${imageUid}?project_id=E56OLrMKYWnzwl3oQj`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${serverRuntimeConfig.BANNERBEAR_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Bannerbear polling error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
                throw new Error(`Failed to poll Bannerbear: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Polling response:', data);

            if (data.status === 'completed') {
                console.log('Image generation completed!');
                return {
                    status: 'completed',
                    image_url: data.image_url,
                    image_url_png: data.image_url_png,
                    image_url_jpg: data.image_url_jpg
                };
            } else if (data.status === 'failed') {
                throw new Error('Image generation failed: ' + JSON.stringify(data));
            }

            // If still pending, wait and try again
            console.log(`Image status: ${data.status}, waiting ${BANNERBEAR_POLLING_INTERVAL_MS}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, BANNERBEAR_POLLING_INTERVAL_MS));
            return poll();
        } catch (error) {
            if (attempts < BANNERBEAR_MAX_POLLING_ATTEMPTS) {
                console.log(`Error polling, retrying in ${BANNERBEAR_POLLING_INTERVAL_MS}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, BANNERBEAR_POLLING_INTERVAL_MS));
                return poll();
            }
            throw error;
        }
    };

    return await poll();
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

// Update the test function to use collections by default
async function testScraper() {
    // Get URL from command line arguments or use default
    const testUrl = process.argv[2] || 'https://www.rightmove.co.uk/properties/159791096#/?channel=RES_LET';
    console.log('Testing URL:', testUrl);
    
    const cleanUrl = cleanRightmoveUrl(testUrl);
    console.log('Cleaned URL:', cleanUrl);
    
    const propertyData = await scrapeRightmoveProperty(cleanUrl);
    if (propertyData) {
        console.log('Successfully scraped property data!');
        
        // Use template set generation by default
        const templateSetUid = serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID;
        
        if (!templateSetUid) {
            console.log('No template set UID configured, falling back to single template generation...');
            const bannerbearResponse = await generateBannerbearImage(propertyData);
            console.log('Single image generation initiated!');
            console.log('Image UID for tracking:', bannerbearResponse.uid);
            console.log('Webhook URL:', bannerbearResponse.webhook_url);
            return;
        }
        
        console.log('Generating collection using template set:', templateSetUid);
        const collectionResponse = await generateBannerbearCollection(propertyData, templateSetUid);
        
        console.log('Collection generation initiated!');
        console.log('Collection UID for tracking:', collectionResponse.uid);
        console.log('Webhook URL:', collectionResponse.webhook_url);
        console.log('\nTo check collection status, visit:');
        console.log(`http://localhost:3000/image-status/${collectionResponse.uid}`);
    }
}

// Update collection generation function to include project_id
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
                property_id: propertyData.raw.property.id,
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

// Update webhook handler to handle collection responses
function processBannerbearWebhook(webhookData) {
    if (webhookData.template_set) {
        // This is a collection response
        return {
            type: 'collection',
            status: webhookData.status,
            images: webhookData.images,
            image_urls: webhookData.image_urls,
            template_set: webhookData.template_set,
            metadata: webhookData.metadata
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
            metadata: webhookData.metadata
        };
    }
}

// Export functions
module.exports = {
    scrapeRightmoveProperty,
    generateBannerbearImage,
    generateBannerbearCollection,
    processBannerbearWebhook,
    testScraper
};

// Run the test
testScraper(); 