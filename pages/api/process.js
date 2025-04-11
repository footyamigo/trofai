// Import AWS SDK
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const getConfig = require('next/config').default;
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import our unified scraper module
const { scrapeProperty, generateBannerbearImage, generateBannerbearCollection } = require('../../scraper');

// Get server config with clear fallbacks
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

// Extract all API keys and config with fallbacks
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;
const BANNERBEAR_TEMPLATE_UID = serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID || process.env.BANNERBEAR_TEMPLATE_UID;
const BANNERBEAR_TEMPLATE_SET_UID = serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID || process.env.BANNERBEAR_TEMPLATE_SET_UID;
const BANNERBEAR_WEBHOOK_URL = serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL || process.env.BANNERBEAR_WEBHOOK_URL;
const BANNERBEAR_WEBHOOK_SECRET = serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET || process.env.BANNERBEAR_WEBHOOK_SECRET;
const AWS_ACCESS_KEY_ID = serverRuntimeConfig.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = serverRuntimeConfig.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
const AWS_REGION = serverRuntimeConfig.AWS_REGION || process.env.REGION || 'us-east-1';
const OPENAI_API_KEY = serverRuntimeConfig.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_MODEL = serverRuntimeConfig.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
const FIRECRAWL_API_KEY = serverRuntimeConfig.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;

// Add this after the other constants
const BANNERBEAR_POLLING_INTERVAL = 2000; // 2 seconds
const BANNERBEAR_MAX_POLLING_ATTEMPTS = 30; // 1 minute total polling time 

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define table names
const TABLES = {
  PROPERTIES: 'trofai-properties',
  CAPTIONS: 'trofai-captions',
  DESIGNS: 'trofai-designs',
  IMAGE_STATUS: 'trofai-image-status',
  USERS: 'trofai-users',
  PROPERTY_CONTENT: 'trofai-property-content'
};

// Function to clean Rightmove URL
function cleanRightmoveUrl(url) {
  try {
    if (url.includes('rightmove.co.uk')) {
  const propertyId = url.split('/properties/')[1].split(/[#?]/)[0];
  return `https://www.rightmove.co.uk/properties/${propertyId}`;
}
    // If not a Rightmove URL, return as is
    return url;
  } catch (error) {
    console.warn('Failed to clean URL, using original:', error);
    return url;
  }
}

// Note: The original scrapeProperty, pollForResults, and processResults functions are replaced by the imported scraper module

// Function to format address (kept for compatibility with existing code)
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

// Function to format price (kept for compatibility with existing code)
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

// Function to validate URL
function isValidUrl(url) {
  try {
    // Check if it's a string first
    if (typeof url !== 'string') {
      console.log('URL validation failed: Not a string');
      return false;
    }

    // Special case for Rightmove media URLs
    if (url.includes('media.rightmove.co.uk')) {
      console.log('URL validation passed: Rightmove media URL');
      return true;
    }

    // For all other URLs, do standard validation
    const parsedUrl = new URL(url);
    const isValid = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    console.log(`URL validation ${isValid ? 'passed' : 'failed'}: ${url}`);
    return isValid;
  } catch (error) {
    console.log(`URL validation error: ${error.message} for URL: ${url}`);
    return false;
  }
}

// Now directly using the imported generateCaption function from the scraper
async function generateCaption(propertyData) {
  try {
    // If we don't have OpenAI configured, fall back to a basic caption
  if (!OPENAI_API_KEY) {
      console.warn('No OpenAI API key found, using fallback caption');
    return { 
        main: generateFallbackCaption(propertyData),
        alt: generateAlternativeFallbackCaption(propertyData)
      };
    }
    
    // For simplicity, we'll just make sure we have some key fields populated
    const systemPrompt = `You are a luxury real estate copywriter known for creating compelling, sophisticated property listings. Your captions:
- Have a captivating hook that creates curiosity
- Use vivid, descriptive language that paints a picture of living in the property
- Highlight key features and luxury aspects
- Include subtle references to the property's investment potential
- End with a clear call-to-action
- Include appropriate emojis for visual breaks (but not excessively)
- Include 3-5 relevant hashtags`;

    const userPrompt = `Create a luxury real estate caption for this property:
- Location: ${propertyData.location_name || 'Not specified'}
- Price: ${propertyData.price || 'Not specified'}
- Bedrooms: ${propertyData.bedroom || 'Not specified'}
- Bathrooms: ${propertyData.bathrooms || 'Not specified'}
- Description: ${propertyData.description || 'Not available'}
- Agent: ${propertyData.estate_agent_name || 'Property Agent'}

Write in a sophisticated, aspirational style with 2-3 paragraphs. Include 3-5 relevant hashtags at the end. Maximum 2000 characters.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });
    
    const caption = response.choices[0].message.content.trim();
    console.log('Generated caption length:', caption.length);
    
    return {
      main: caption,
      alt: generateAlternativeFallbackCaption(propertyData) // Always provide a fallback as alt
    };
    
  } catch (error) {
    console.error('Error generating caption with OpenAI:', error);
    console.warn('Falling back to basic caption');
    return { 
      main: generateFallbackCaption(propertyData),
      alt: generateAlternativeFallbackCaption(propertyData)
    };
  }
}

// Simple caption generation for fallback
function generateFallbackCaption(propertyData) {
  const price = propertyData.price || 'Contact for price';
  const location = propertyData.location_name || 'Prime location';
  const bedroomCount = propertyData.bedroom || '';
  const bathroomCount = propertyData.bathrooms || '';
  
  let bedroomPhrase = '';
  if (bedroomCount) {
    bedroomPhrase = `${bedroomCount} bedroom${bedroomCount === 1 ? '' : 's'}`;
  }
  
  let bathroomPhrase = '';
  if (bathroomCount) {
    bathroomPhrase = `${bathroomCount} bathroom${bathroomCount === 1 ? '' : 's'}`;
  }
  
  let sizePhrase = '';
  if (bedroomPhrase && bathroomPhrase) {
    sizePhrase = `${bedroomPhrase}, ${bathroomPhrase}`;
  } else if (bedroomPhrase) {
    sizePhrase = bedroomPhrase;
  } else if (bathroomPhrase) {
    sizePhrase = bathroomPhrase;
  }
  
  const agent = propertyData.estate_agent_name || 'Contact us';
  const locationTag = location.split(',')[0].trim().replace(/\s+/g, '');
  
  return `✨ **Luxury Living** ✨

${sizePhrase ? `Stunning ${sizePhrase} property available in ` : 'Exceptional property in '}${location}. Offered at ${price}.

Contact ${agent} today to arrange a viewing of this highly desirable property before it's gone!

#LuxuryProperty #${locationTag} #RealEstateLondon`;
}

function generateAlternativeFallbackCaption(propertyData) {
  const price = propertyData.price || 'Contact for price';
  const location = propertyData.location_name || 'Prime location';
  const bedroomCount = propertyData.bedroom || '';
  const agent = propertyData.estate_agent_name || 'us';
  const locationTag = location.split(',')[0].trim().replace(/\s+/g, '');
  
  let bedroomPhrase = bedroomCount ? `${bedroomCount}-bedroom ` : '';
  
  return `🏠 Discover this ${bedroomPhrase}property in ${location} at ${price}!

Arrange a viewing with ${agent} today to secure this exceptional living space in a prime location.

#LuxuryLiving #${locationTag} #VertusHomes #LondonRentals`;
}

// Add this new function before the main handler 
async function pollBannerbearStatus(uid, propertyId, isCollection = true) {
  console.log(`Starting to poll Bannerbear for ${isCollection ? 'collection' : 'image'} with UID ${uid}`);
  
  let attempts = 0;
  
  const fetchStatus = async () => {
    if (attempts >= BANNERBEAR_MAX_POLLING_ATTEMPTS) {
      console.warn(`Max polling attempts (${BANNERBEAR_MAX_POLLING_ATTEMPTS}) reached for ${uid}`);
      return null;
    }
    
    attempts++;
    console.log(`Polling attempt ${attempts}/${BANNERBEAR_MAX_POLLING_ATTEMPTS} for ${uid}`);
    
    try {
      const apiPath = isCollection ? 'collections' : 'images';
      const response = await fetch(`https://api.bannerbear.com/v2/${apiPath}/${uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Bannerbear API error: ${response.status}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`Bannerbear status for ${uid}: ${data.status}`);
      
      if (data.status === 'completed') {
        // Update DynamoDB with completed data
        console.log('Updating DynamoDB with completed Bannerbear data');
        await dynamoDb.update({
          TableName: TABLES.PROPERTY_CONTENT,
          Key: { id: propertyId },
          UpdateExpression: 'SET #status = :status, images = :images, updatedAt = :updatedAt, bannerbearResponse = :bannerbearResponse, zip_url = :zip_url, image_urls = :image_urls',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': 'completed',
            ':images': data.images || [],
            ':updatedAt': new Date().toISOString(),
            ':bannerbearResponse': data,
            ':zip_url': data.zip_url || null,
            ':image_urls': data.image_urls || {}
          }
        }).promise();
        
        console.log('Successfully updated DynamoDB with completed Bannerbear data');
        return data;
      }
      
      // If still pending, wait and try again
      await new Promise(resolve => setTimeout(resolve, BANNERBEAR_POLLING_INTERVAL));
      return fetchStatus();
    } catch (error) {
      console.error(`Error polling Bannerbear: ${error.message}`);
      return null;
    }
  };
  
  return fetchStatus();
}

// Main API handler
export default async function handler(req, res) {
  console.log('Starting API request');
  console.log('Request method:', req.method);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the session token
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized - No session provided' });
    }

    // Validate session with DynamoDB
    const userResponse = await dynamoDb.query({
      TableName: TABLES.USERS,
      IndexName: 'SessionIndex',
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: {
        '#sess': 'session'
      },
      ExpressionAttributeValues: {
        ':session': session
      }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ message: 'Unauthorized - Invalid session' });
    }

    const userId = userResponse.Items[0].userId;

    // Get parameters from either query or body for backward compatibility
    const params = { ...req.query, ...req.body };
    const { url } = params;

    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Log environment variables (without exposing full keys)
    console.log('Environment check:', {
      BANNERBEAR_API_KEY: BANNERBEAR_API_KEY ? '✓ Set' : '✗ Missing',
      BANNERBEAR_TEMPLATE_UID: BANNERBEAR_TEMPLATE_UID ? '✓ Set' : '✗ Missing',
      AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing',
      AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing',
      OPENAI_API_KEY: OPENAI_API_KEY ? '✓ Set' : '✗ Missing',
      FIRECRAWL_API_KEY: FIRECRAWL_API_KEY ? '✓ Set' : '✗ Missing',
      USE_FIRECRAWL: serverRuntimeConfig.USE_FIRECRAWL || process.env.USE_FIRECRAWL
    });
    
    let propertyData;
    let propertyUrl = url;
    
    // If we have a property ID but not a URL, get it from DynamoDB
    if (url && !url.includes('rightmove.co.uk')) {
      console.log('Attempting to fetch property from DynamoDB with URL:', url);
      
      if (!dynamoDb) {
        return res.status(400).json({ error: 'DynamoDB not configured and no URL provided' });
      }
      
      const { Item } = await dynamoDb.get({
        TableName: TABLES.PROPERTIES,
        Key: { url: url }
      }).promise();
      
      if (!Item) {
        return res.status(404).json({ error: 'Property not found in database' });
      }
      
      propertyUrl = Item.url;
      propertyData = Item.data;
      
      console.log('Retrieved property from database:', {
        url: propertyUrl
      });
    }
    
    // If we don't have property data yet, scrape it
    if (!propertyData) {
      console.log('Starting property scrape with URL:', propertyUrl);
      
      // Clean the URL first
      const cleanedUrl = cleanRightmoveUrl(propertyUrl);
      console.log('Cleaned URL:', cleanedUrl);
      
      try {
        // Log which scraper module we're using
        console.log('Using unified scraper module with USE_FIRECRAWL=', serverRuntimeConfig.USE_FIRECRAWL || process.env.USE_FIRECRAWL);
        
        // Perform the actual scraping using our unified scraper
        console.log('Calling scraper.scrapeProperty()...');
        propertyData = await scrapeProperty(cleanedUrl);
        
        if (!propertyData) {
          console.error('scrapeProperty returned null or undefined');
          return res.status(500).json({ error: 'Failed to scrape property data - no data returned' });
        }
        
        console.log('Successfully scraped property data. Raw data keys:', Object.keys(propertyData));
        console.log('Property type:', propertyData.raw?.property?.price);
        console.log('Banner details:', propertyData.bannerbear?.template);
      } catch (scrapeError) {
        console.error('Error in scrapeProperty function:', scrapeError);
      return res.status(500).json({
          error: 'Failed to scrape property data',
          message: scrapeError.message,
          stack: scrapeError.stack 
        });
      }
    }
    
    // Generate Bannerbear images
    console.log('Initiating Bannerbear image generation');
    
    // Generate images using our imported generateBannerbearCollection function
    let bannerbearResponse;
    const templateSetToUse = params.templateId || BANNERBEAR_TEMPLATE_SET_UID || process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID;
    
    // Log Bannerbear configuration details
    console.log('Bannerbear configuration:', {
      templateSetToUse,
      BANNERBEAR_API_KEY: BANNERBEAR_API_KEY ? 'Set (starts with ' + BANNERBEAR_API_KEY.substring(0, 6) + '...)' : 'Not set',
      BANNERBEAR_TEMPLATE_SET_UID: BANNERBEAR_TEMPLATE_SET_UID || 'Not set',
      NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID: process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID || 'Not set'
    });
    
    if (!templateSetToUse) {
      console.warn('No template set UID provided, falling back to default template set');
      // Fallback to a hardcoded template set UID
      templateSetToUse = '5AaLxyr4P8xrP8bDRG';
    }
    
    try {
      console.log('Using template set for collection generation:', templateSetToUse);
      bannerbearResponse = await generateBannerbearCollection(propertyData, templateSetToUse);
      console.log('Bannerbear response received:', JSON.stringify(bannerbearResponse, null, 2));
    } catch (error) {
      console.error('Error generating Bannerbear collection:', error.message);
      
      // Try to generate a single image instead if collection fails
      try {
        console.log('Attempting fallback to single template image generation');
        bannerbearResponse = await generateBannerbearImage(propertyData);
        console.log('Single image generation succeeded:', JSON.stringify(bannerbearResponse, null, 2));
      } catch (singleImageError) {
        console.error('Both collection and single image generation failed:', singleImageError.message);
        
        // Return a partial response even if Bannerbear fails
        return res.status(206).json({
          message: 'Property scraped successfully but Bannerbear image generation failed',
          error: error.message,
          data: {
            property: {
              address: propertyData.raw?.property?.address || '',
              price: propertyData.raw?.property?.price || '',
              bedrooms: propertyData.raw?.property?.bedrooms || '',
              bathrooms: propertyData.raw?.property?.bathrooms || ''
            },
            scraped: true,
            bannerbear_status: 'failed'
          }
        });
      }
    }
    
    if (!bannerbearResponse) {
      return res.status(500).json({ error: 'Failed to generate Bannerbear response' });
    }

    console.log('Bannerbear generation completed successfully');
    
    // Generate propertyId outside the try block so it's available throughout
    const propertyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Update the bannerbear response to include propertyId in metadata for webhook handling
    if (bannerbearResponse) {
      bannerbearResponse.metadata = {
        ...(bannerbearResponse.metadata || {}),
        propertyId: propertyId
      };
    }

    try {
      // Store completed property content with full Bannerbear response
      await dynamoDb.put({
        TableName: TABLES.PROPERTY_CONTENT,
        Item: {
          id: propertyId,
          userId: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
          propertyData: propertyData,
          status: 'completed',
          address: propertyData.raw?.property?.address || '',
          price: propertyData.raw?.property?.price || '',
          templateId: templateSetToUse,
          // Store the complete Bannerbear response exactly as received
          bannerbear: bannerbearResponse
        }
      }).promise();

      // Save to properties table with user association
      await dynamoDb.put({
        TableName: TABLES.PROPERTIES,
        Item: {
          propertyId,
          userId: userId,
          url: propertyUrl,
          data: propertyData.raw,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();

      // Save to designs table with user association
      await dynamoDb.put({
        TableName: TABLES.DESIGNS,
        Item: {
          uid: bannerbearResponse.uid,
          designId: bannerbearResponse.uid,
          propertyId,
          userId: userId,
          status: bannerbearResponse.status || 'completed',
          type: 'collection',
          templateId: templateSetToUse,
          createdAt: timestamp,
          updatedAt: timestamp,
          // Store the complete response data
          ...bannerbearResponse
        }
      }).promise();

      // Store caption in DynamoDB
      const captionId = crypto.randomUUID();
      await dynamoDb.put({
        TableName: TABLES.CAPTIONS,
        Item: {
          captionId,
          userId,
          propertyId,
          designId: bannerbearResponse.uid,
          caption: propertyData.caption,
          captionOptions: propertyData.captionOptions || {},
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();

      // Save status to image-status table
      await dynamoDb.put({
        TableName: TABLES.IMAGE_STATUS,
        Item: {
          uid: bannerbearResponse.uid,
          imageId: bannerbearResponse.uid,
          propertyId,
          userId: userId,
          status: bannerbearResponse.status || 'completed',
          createdAt: timestamp,
          updatedAt: timestamp,
          // Store the complete response data
          ...bannerbearResponse
        }
      }).promise();

      // Update user's properties list
      try {
        await dynamoDb.update({
          TableName: TABLES.USERS,
          Key: { userId: userId },
          UpdateExpression: 'SET properties = list_append(if_not_exists(properties, :empty_list), :property_id)',
          ExpressionAttributeValues: {
            ':empty_list': [],
            ':property_id': [propertyId]
          }
        }).promise();
      } catch (userUpdateError) {
        console.error('Failed to update user properties list:', userUpdateError);
        await dynamoDb.put({
          TableName: TABLES.USERS,
          Item: {
            userId: userId,
            email: userResponse.Items[0].email,
            properties: [propertyId],
            createdAt: timestamp,
            updatedAt: timestamp
          }
        }).promise();
      }

      console.log('Successfully saved initial Bannerbear response to DynamoDB');
      
      // Start polling for completed status
      console.log('Starting background polling for Bannerbear status');
      pollBannerbearStatus(
        bannerbearResponse.uid, 
        propertyId, 
        !!bannerbearResponse.template_set
      ).catch(error => {
        console.error('Error in background polling:', error);
      });

      // Return success response with complete data
      return res.status(200).json({
        message: 'Processing completed',
        data: {
          propertyId,
          bannerbear: bannerbearResponse,
          caption: propertyData.caption || '',
          property: {
            address: propertyData.raw?.property?.address || '',
            price: propertyData.raw?.property?.price || '',
            bedrooms: propertyData.raw?.property?.bedrooms || '',
            bathrooms: propertyData.raw?.property?.bathrooms || '',
            squareFeet: propertyData.raw?.property?.square_ft || ''
          }
        }
      });
    } catch (dbError) {
      console.error('Failed to store data in DynamoDB:', dbError);
      return res.status(500).json({ 
        error: 'Failed to store data',
        message: dbError.message
      });
    }
    
  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ error: error.message });
  }
} 