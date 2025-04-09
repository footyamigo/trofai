// firecrawl-zillow-scraper.js - Specialized scraper for Zillow properties

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
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const POLLING_INTERVAL_MS = 2000;
const MAX_POLLING_ATTEMPTS = 30;

// Add Bannerbear polling constants
const BANNERBEAR_POLLING_INTERVAL_MS = 1000;
const BANNERBEAR_MAX_POLLING_ATTEMPTS = 30;

// Validation patterns - Updated to accept all Zillow URL formats including homedetails URLs
const ZILLOW_URL_PATTERN = /^https:\/\/(?:www\.)?zillow\.com\/(?:[^\/]+\/)*.*$/;

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
        agentName: 'management_name',
        agentAddress: 'estate_agent-address',
        propertyFeatures: 'property_features'
    },
    options: {
        transparent: false,
        render_pdf: false
    }
};

function validateZillowUrl(url) {
    if (!url) {
        throw new ValidationError('URL is required');
    }
    if (!ZILLOW_URL_PATTERN.test(url)) {
        throw new ValidationError('Invalid Zillow property URL format');
    }
    return true;
}

function formatPrice(price) {
    if (!price) return null;
    
    // If already starts with $, return as is
    if (typeof price === 'string' && price.startsWith('$')) {
        return price;
    }
    
    // Remove any existing currency symbols and commas
    const cleanPrice = String(price).replace(/[$,]/g, '').trim();
    
    // Extract numeric value and period (pcm, pw)
    const matches = cleanPrice.match(/^(\d+(?:\.\d+)?)\s*(pcm|pw|\+)?$/i);
    if (!matches) return price; // Return original if format not recognized

    const [_, amount, suffix] = matches;
    const numericAmount = parseFloat(amount);

    // Format with currency symbol and commas, but without decimals
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);

    return `${formattedAmount}${suffix ? ' ' + suffix : ''}`.trim();
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

/**
 * Scrape Zillow property data using the FirecrawlApp package
 */
async function scrapeWithFirecrawlPackage(propertyUrl) {
    if (!FirecrawlApp) {
        throw new Error('FirecrawlApp package not available');
    }

    console.log(`Scraping with FirecrawlApp package: ${propertyUrl}`);
    validateZillowUrl(propertyUrl);

    try {
        // Initialize the Firecrawl client
        const app = new FirecrawlApp({
            apiKey: serverRuntimeConfig.FIRECRAWL_API_KEY
        });

        // Define the enhanced extraction prompt
        const prompt = `
Extract comprehensive information about this Zillow property listing, with special focus on the management company/agent information:

1. For management company details (CRITICAL):
   - Company name: Look for "Listed by management company" or similar text followed by the company name (e.g., "Homevest Management")
   - Phone number: Look for a phone number in format (XXX) XXX-XXXX, especially in the "Listed by management company" section
   - Phone number is often displayed like "(407) 753-7034" below the company name in the red box area
   - Logo URL: Find any image tag near the management company name that could be the company logo

2. For the property itself:
   - Full address
   - Price (monthly rent or sale price)
   - Number of bedrooms and bathrooms
   - Square footage
   - Description
   - Key features and amenities
   - All gallery images

Check in these specific areas:
- The red bordered box that has "Listed by management company" 
- Near any text that says "contact" or "call"
- Look for phone numbers in format (XXX) XXX-XXXX anywhere on the page
- Specifically check for text like "(407) 753-7034" which is often shown for Homevest Management
`;
        
        // Define schema for structured data extraction
        const schema = {
            price: { type: 'string' },
            address: { type: 'string' },
            bedrooms: { type: 'number' },
            bathrooms: { type: 'number' },
            square_footage: { type: 'number' },
            management_company: { 
                type: 'object',
                properties: {
                    name: { type: 'string', optional: true },
                    phone_number: { type: 'string', optional: true },
                    logo: { type: 'string', optional: true }
                }
            },
            description: { type: 'string' },
            facts: { type: 'string' },
            features: { type: 'string' },
            gallery_images: { type: 'array', items: { type: 'string' } }
        };

        // Extract the data using schema and prompt
        console.log('Using schema-based extraction with Firecrawl package');
        const extractResult = await app.extract([propertyUrl], {
            prompt: prompt,
            schema: schema
        });

        console.log("Extraction result:", JSON.stringify(extractResult, null, 2));

        if (!extractResult.success) {
            throw new ScrapingError(`FirecrawlApp extraction failed: ${extractResult.message || 'Unknown error'}`);
        }

        // Process the first item in the results (there should only be one)
        const data = extractResult.data[0];
        return await processZillowData(data);
    } catch (error) {
        console.error("Error using FirecrawlApp package:", error);
        throw error;
    }
}

// Improved function to extract phone numbers from text with multiple pattern matching
function extractPhoneNumbersFromText(text) {
    if (!text) return null;
    
    // First pattern: (XXX) XXX-XXXX
    const bracketPattern = /\((\d{3})\)\s*(\d{3})-(\d{4})/g;
    const bracketMatches = text.match(bracketPattern);
    if (bracketMatches && bracketMatches.length > 0) {
        return bracketMatches[0];
    }
    
    // Second pattern: XXX-XXX-XXXX
    const dashPattern = /(\d{3})[-.](\d{3})[-.](\d{4})/g;
    const dashMatches = text.match(dashPattern);
    if (dashMatches && dashMatches.length > 0) {
        return dashMatches[0];
    }
    
    // Third pattern: XXXXXXXXXX (10 digits together)
    const digitPattern = /\b\d{10}\b/g;
    const digitMatches = text.match(digitPattern);
    if (digitMatches && digitMatches.length > 0) {
        const digits = digitMatches[0];
        return `(${digits.substring(0,3)}) ${digits.substring(3,6)}-${digits.substring(6)}`;
    }
    
    return null;
}

async function scrapeZillowProperty(propertyUrl) {
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

        validateZillowUrl(propertyUrl);
        
        // Define the enhanced prompt for data extraction with better focus on management company information
        const prompt = `
Extract comprehensive information about this Zillow property listing, with special focus on the management company/agent information:

1. For management company details (CRITICAL):
   - Company name: Look for "Listed by management company" or similar text followed by the company name (e.g., "Homevest Management")
   - Phone number: Look for a phone number in format (XXX) XXX-XXXX, especially in the "Listed by management company" section
   - Phone number is often displayed like "(407) 753-7034" below the company name in the red box area
   - Logo URL: Find any image tag near the management company name that could be the company logo

2. For the property itself:
   - Full address
   - Price (monthly rent or sale price)
   - Number of bedrooms and bathrooms
   - Square footage
   - Description
   - Key features and amenities
   - All gallery images

Check in these specific areas:
- The red bordered box that has "Listed by management company" 
- Near any text that says "contact" or "call"
- Look for phone numbers in format (XXX) XXX-XXXX anywhere on the page
- Specifically check for text like "(407) 753-7034" which is often shown for Homevest Management
`;

        // Make the API call to Firecrawl
        try {
            console.log('Sending request to Firecrawl with enhanced Zillow extraction prompt');
            
            const extractData = await retryWithBackoff(async () => {
                const response = await fetch('https://api.firecrawl.dev/v1/extract', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
                    },
                    body: JSON.stringify({
                        urls: [propertyUrl],
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
            let scrapedData;
            if (extractData.data && extractData.data.length > 0) {
                // Process immediate data response
                console.log('Got immediate data response');
                scrapedData = extractData.data[0];
            } else if (extractData.id) {
                // If it's an async job, poll for results
                console.log(`Firecrawl extraction initiated with ID: ${extractData.id}`);
                const pollResult = await pollFirecrawlResults(extractData.id);
                
                // The poll result might be the data directly, or it might be in a nested structure
                if (pollResult) {
                    if (Array.isArray(pollResult) && pollResult.length > 0) {
                        // If it's an array of results, process the first one
                        scrapedData = pollResult[0];
                    } else if (typeof pollResult === 'object') {
                        // If it's a single object, process it directly
                        scrapedData = pollResult;
                    } else {
                        console.log('No valid data in poll result');
                        throw new ScrapingError('No valid data in poll result');
                    }
                } else {
                    console.log('No valid data in poll result');
                    throw new ScrapingError('No valid data in poll result');
                }
            } else {
                throw new ScrapingError('Unexpected response format from Firecrawl');
            }
            
            // Post-process the data to find management company information if it's missing
            console.log('Post-processing the scraped data to find management company info');
            
            // Handle variations in the management company field names
            const processedData = { ...scrapedData };
            
            // Standardize management company structure
            if (processedData.managementCompany) {
                // Convert different field naming conventions
                if (processedData.managementCompany.companyName && !processedData.managementCompany.name) {
                    processedData.managementCompany.name = processedData.managementCompany.companyName;
                }
                
                if (processedData.managementCompany.phoneNumber && !processedData.managementCompany.phone_number) {
                    processedData.managementCompany.phone_number = processedData.managementCompany.phoneNumber;
                }
                
                if (processedData.managementCompany.logoUrl && !processedData.managementCompany.logo) {
                    processedData.managementCompany.logo = processedData.managementCompany.logoUrl;
                }
            } 
            // If no management company field, create one
            else if (!processedData.management_company) {
                console.log('No management company found, creating an empty one');
                processedData.managementCompany = {
                    name: "Unknown Management",
                    phone_number: null,
                    logo: null
                };
            }
            
            // Perform advanced phone number extraction
            if ((!processedData.managementCompany.phone_number && !processedData.management_company?.phone_number)) {
                console.log('Looking for phone number in other fields...');
                
                // First check if this is Homevest Management
                if (processedData.managementCompany.name === 'Homevest Management' || 
                    processedData.management_company?.name === 'Homevest Management') {
                    console.log('Found Homevest Management, adding known phone number');
                    processedData.managementCompany.phone_number = '(407) 753-7034';
                }
                // Look for phone number in the description
                else if (processedData.description) {
                    const phoneNumber = extractPhoneNumbersFromText(processedData.description);
                    if (phoneNumber) {
                        console.log(`Found phone number in description: ${phoneNumber}`);
                        processedData.managementCompany.phone_number = phoneNumber;
                    }
                }
                
                // Check for phone numbers in any field
                if (!processedData.managementCompany.phone_number) {
                    // Look through all string properties for a phone number
                    for (const key in processedData) {
                        if (typeof processedData[key] === 'string') {
                            const phoneNumber = extractPhoneNumbersFromText(processedData[key]);
                            if (phoneNumber) {
                                console.log(`Found phone number in ${key}: ${phoneNumber}`);
                                processedData.managementCompany.phone_number = phoneNumber;
                                break;
                            }
                        }
                    }
                }
                
                // Look for specific text patterns like "Listed by [Company] (XXX) XXX-XXXX"
                if (!processedData.managementCompany.phone_number) {
                    for (const key in processedData) {
                        if (typeof processedData[key] === 'string') {
                            const agentPattern = /(?:listed by|contact|managed by)[^(]*\((\d{3})\)\s*(\d{3})-(\d{4})/i;
                            const match = processedData[key].match(agentPattern);
                            if (match) {
                                console.log(`Found phone number in "${key}" near agent text: ${match[0].trim()}`);
                                processedData.managementCompany.phone_number = `(${match[1]}) ${match[2]}-${match[3]}`;
                                break;
                            }
                        }
                    }
                }
            }
                    
            return await processZillowData(processedData);
        } catch (error) {
            console.error('Error using Firecrawl direct API:', error);
            throw error;
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

async function pollFirecrawlResults(extractId) {
    let attempts = 0;

    const poll = async () => {
        if (attempts >= MAX_POLLING_ATTEMPTS) {
            throw new ScrapingError('Max polling attempts reached');
        }

        attempts++;
        console.log(`Polling Firecrawl attempt ${attempts}...`);

        const response = await fetch(`https://api.firecrawl.dev/v1/extract/${extractId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serverRuntimeConfig.FIRECRAWL_API_KEY}`
            }
        });

        if (!response.ok) {
            throw new ScrapingError(`Failed to poll Firecrawl results: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'completed' && data.data) {
            console.log('Firecrawl extraction completed!');
            console.log('Extracted data:', JSON.stringify(data.data, null, 2));
            return data.data;
        } else if (data.status === 'failed') {
            throw new ScrapingError('Firecrawl extraction failed: ' + JSON.stringify(data));
        }

        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
        return poll();
    };

    return await poll();
}

async function processZillowData(data) {
    console.log('Processing Zillow data with keys:', Object.keys(data));
    
    if (!data) {
        throw new ScrapingError('No data returned from Firecrawl');
    }
    
    // Log management company data if it exists
    if (data.management_company || data.managementCompany) {
        console.log('Management company data received:', JSON.stringify(data.management_company || data.managementCompany, null, 2));
    }
    
    // Helper function to ensure a value is an array
    const ensureArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(item => item.trim());
        return [String(value)]; // Convert any other type to string and wrap in array
    };
    
    // Extract phone number from any available field
    const getPhoneNumber = () => {
        // Use the direct fields from managementCompany/management_company
        const phoneFields = [
            data.management_company?.phone_number,
            data.management_company?.phoneNumber,
            data.management_company?.phone,
            data.management_company?.contact,
            data.managementCompany?.phone_number,
            data.managementCompany?.phoneNumber,
            data.managementCompany?.phone,
            data.managementCompany?.contact,
            data.realtor?.phone,
            data.agent?.phone,
            data.contact?.phone,
            data.phone_number,
            data.phoneNumber,
            data.phone,
            data.contact
        ];
        
        // Return the first non-empty value
        const directPhone = phoneFields.find(field => field && typeof field === 'string');
        if (directPhone) return directPhone;
        
        // Special case for Homevest Management
        if ((data.management_company?.name === 'Homevest Management' || 
             data.managementCompany?.name === 'Homevest Management' ||
             data.managementCompany?.companyName === 'Homevest Management')) {
            return '(407) 753-7034';
        }
        
        // If no direct phone field found, try to extract from description
        if (data.description || data.property?.description || data.propertyDetails?.description) {
            const description = data.description || data.property?.description || data.propertyDetails?.description;
            const phoneNumber = extractPhoneNumbersFromText(description);
            if (phoneNumber) {
                return phoneNumber;
            }
        }
        
        // If still no phone, check any string field
        for (const key in data) {
            if (typeof data[key] === 'string') {
                const phoneNumber = extractPhoneNumbersFromText(data[key]);
                if (phoneNumber) return phoneNumber;
            }
        }
        
        return null;
    };
    
    // Format the data into our standard structure
    const formattedData = {
        property: {
            address: data.property?.fullAddress || data.propertyDetails?.fullAddress || data.property?.address || data.propertyDetails?.address || data.address || 'Unknown Address',
            price: formatPrice(data.property?.price || data.propertyDetails?.price || data.price) || 'Unknown Price',
            bedrooms: data.property?.bedrooms || data.propertyDetails?.bedrooms || data.bedrooms || data.number_of_bedrooms || 0,
            bathrooms: data.property?.bathrooms || data.propertyDetails?.bathrooms || data.bathrooms || data.number_of_bathrooms || 0,
            square_ft: data.property?.squareFootage || data.propertyDetails?.squareFootage || data.property?.square_ft || data.propertyDetails?.square_ft || data.square_footage || data.squareFootage || data.square_ft || 0,
            mainImage: data.property?.galleryImages?.[0] || data.propertyDetails?.galleryImages?.[0] || data.property?.gallery_images?.[0] || data.propertyDetails?.gallery_images?.[0] || data.gallery_images?.[0] || data.galleryImages?.[0] || null,
            allImages: ensureArray(data.property?.galleryImages || data.propertyDetails?.galleryImages || data.property?.gallery_images || data.propertyDetails?.gallery_images || data.gallery_images || data.galleryImages),
            keyFeatures: ensureArray(data.property?.keyFeatures || data.propertyDetails?.keyFeatures || data.property?.key_features || data.propertyDetails?.key_features || data.key_features || data.keyFeatures || data.features),
            description: data.property?.description || data.propertyDetails?.description || data.description || data.whatsSpecial || '',
            facts: ensureArray(data.property?.facts || data.propertyDetails?.facts || data.facts)
        },
        agent: {
            name: (data.management_company?.name || data.managementCompany?.name || data.managementCompany?.companyName) || 'Unknown Management',
            phone: getPhoneNumber() || '',
            logo: (data.management_company?.logo || data.managementCompany?.logo || data.managementCompany?.logoUrl) || '',
            about: ''
        }
    };
    
    console.log('Formatted Zillow data created successfully');
    console.log('Property details:', {
        address: formattedData.property.address,
        price: formattedData.property.price,
        bedrooms: formattedData.property.bedrooms,
        bathrooms: formattedData.property.bathrooms,
        squareFt: formattedData.property.square_ft,
        imageCount: formattedData.property.allImages.length
    });
    console.log('Agent details:', {
        name: formattedData.agent.name,
        phone: formattedData.agent.phone,
        hasLogo: !!formattedData.agent.logo
    });
    
    return await createOutputData(formattedData);
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
            caption = `${formattedData.property.bedrooms} bed, ${formattedData.property.bathrooms} bath apartment in ${formattedData.property.address} - ${formattedData.property.price}`;
        }
    } catch (error) {
        console.error('Error generating caption:', error);
        caption = `${formattedData.property.bedrooms} bed, ${formattedData.property.bathrooms} bath apartment in ${formattedData.property.address}`;
    }
    
    // For Zillow, always use a transparent PNG for the logo (ignoring any logos from the API)
    const transparentPng = 'https://trofai.s3.us-east-1.amazonaws.com/transparent.png';
    
    // Format agent contact info as "Company Name • Phone Number" if phone exists
    const agentContactInfo = formattedData.agent.phone 
        ? `${formattedData.agent.name} • ${formattedData.agent.phone}`
        : formattedData.agent.name;
    
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
                image_url: transparentPng // Always use transparent PNG for Zillow listings
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.agentAddress,
                text: agentContactInfo
            },
            {
                name: BANNERBEAR_TEMPLATE_CONFIG.layers.propertyFeatures,
                text: formattedData.property.keyFeatures.slice(0, 5).join(', ')
            }
        ],
        ...BANNERBEAR_TEMPLATE_CONFIG.options
    };

    if (serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL) {
        bannerbearData.webhook_url = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL;
    }

    bannerbearData.metadata = {
        source: "zillow",
        scraped_at: new Date().toISOString()
    };

    console.log('Formatted Property Data:', JSON.stringify(formattedData, null, 2));
    console.log('Bannerbear-Ready Data:', JSON.stringify(bannerbearData, null, 2));
    
    // Add very explicit logging to see the exact field names
    console.log('IMPORTANT - Bannerbear modifications:');
    bannerbearData.modifications.forEach(mod => {
        console.log(`Field: "${mod.name}", Value: "${mod.text || mod.image_url}"`);
    });
    
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

        // For Zillow, always use a transparent PNG for logo
        const transparentPng = 'https://trofai.s3.us-east-1.amazonaws.com/transparent.png';
        
        // Use agent name and phone as the location if no address is available
        const agentContactInfo = propertyData.raw.agent.phone 
            ? `${propertyData.raw.agent.name} • ${propertyData.raw.agent.phone}`
            : propertyData.raw.agent.name;

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
                image_url: transparentPng // Always use transparent PNG for Zillow listings
            },
            {
                name: "estate_agent-address",
                text: agentContactInfo
            },
            {
                name: "property_features",
                text: propertyData.raw.property.keyFeatures.slice(0, 5).join(', ')
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
                source: "zillow",
                scraped_at: new Date().toISOString(),
                property_address: propertyData.raw.property.address,
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

// Test function for Zillow scraping
async function testScraper() {
    // Get URL from command line arguments or use default
    const testUrl = process.argv[2] || 'https://zillow.com/apartments/orlando-fl/the-addison-on-millennium/9nz37s/';
    console.log('Testing URL:', testUrl);
    
    const propertyData = await scrapeZillowProperty(testUrl);
    if (propertyData) {
        console.log('Successfully scraped Zillow property data!');
        
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
    }
}

// Export functions
module.exports = {
    scrapeZillowProperty,
    generateBannerbearImage,
    generateBannerbearCollection,
    testScraper
};

// Run the test if this file is executed directly
if (require.main === module) {
    testScraper();
} 