// Import AWS SDK
const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const getConfig = require('next/config').default;
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
const FIRECRAWL_API_KEY = serverRuntimeConfig.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY;

// Add this after the other constants
const BANNERBEAR_POLLING_INTERVAL = 2000; // 2 seconds
const BANNERBEAR_MAX_POLLING_ATTEMPTS = 30; // 1 minute total polling time 

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

    const userData = userResponse.Items[0]; // Get the full user item
    const userId = userData.userId;

    // Extract Agent Profile Data (with fallbacks)
    const agentProfile = {
      name: userData.agent_name || userData.name || '' , // Fallback to user's name if agent name not set
      email: userData.agent_email || userData.email || '', // Fallback to user's email
      phone: userData.agent_phone || '',
      photo_url: userData.agent_photo_url || null, // Use null if not set
    };
    // Only fetch and log agent profile if it's explicitly an agent flow
    let agentProfileForBannerbear = null;
    const isAgentFlow = req.body.isAgentFlow === true || String(req.body.isAgentFlow).toLowerCase() === 'true';

    if (isAgentFlow) {
        agentProfileForBannerbear = {
            name: userData.agent_name || userData.name || '' ,
            email: userData.agent_email || userData.email || '',
            phone: userData.agent_phone || '',
            photo_url: userData.agent_photo_url || null,
        };
        console.log(`Agent Flow detected. Profile for Bannerbear:`, agentProfileForBannerbear);
    } else {
        console.log('Standard flow detected, not passing agent profile to Bannerbear.');
    }

    // Get parameters from either query or body for backward compatibility
    const params = { ...req.query, ...req.body };
    const { url, listing_type } = params;

    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Log if listing type is provided
    if (listing_type) {
      console.log(`Listing type provided: ${listing_type}`);
    }

    // Log environment variables (without exposing full keys)
    console.log('Environment check:', {
      BANNERBEAR_API_KEY: BANNERBEAR_API_KEY ? '✓ Set' : '✗ Missing',
      BANNERBEAR_TEMPLATE_UID: BANNERBEAR_TEMPLATE_UID ? '✓ Set' : '✗ Missing',
      AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing',
      AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing',
      FIRECRAWL_API_KEY: FIRECRAWL_API_KEY ? '✓ Set' : '✗ Missing',
      USE_FIRECRAWL: serverRuntimeConfig.USE_FIRECRAWL || process.env.USE_FIRECRAWL
    });
    
    let propertyData;
    let propertyUrl = url;
    
    // First check if this is a URL we know how to scrape
    const isRightmoveUrl = url.includes('rightmove.co.uk');
    const isZillowUrl = url.includes('zillow.com');
    const isOnTheMarketUrl = url.includes('onthemarket.com');
    const isKnownScraperUrl = isRightmoveUrl || isZillowUrl || isOnTheMarketUrl;
    
    // Only try to get from DynamoDB if this is not a recognizable scraper URL
    // and might be a property ID from DynamoDB
    if (!isKnownScraperUrl) {
      console.log('URL is not a recognized scraper URL, attempting to fetch property from DynamoDB:', url);
      
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
      
      // Clean the URL only if it's a Rightmove URL
      const cleanedUrl = isRightmoveUrl ? cleanRightmoveUrl(propertyUrl) : propertyUrl;
      console.log('Cleaned URL:', cleanedUrl);
      
      try {
        // Log which scraper module we're using
        console.log('Using unified scraper module with USE_FIRECRAWL=', serverRuntimeConfig.USE_FIRECRAWL || process.env.USE_FIRECRAWL);
        
        // Perform the actual scraping using our unified scraper
        console.log('Calling scraper.scrapeProperty()...');
        propertyData = await scrapeProperty(cleanedUrl, listing_type, agentProfile);
        
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
    const templateSetToUse = params.templateId || BANNERBEAR_TEMPLATE_SET_UID;
    
    if (templateSetToUse) {
      console.log('Using template set for collection generation:', templateSetToUse);
      // Pass the listing_type to the Bannerbear generation function
      bannerbearResponse = await generateBannerbearCollection(
        propertyData, 
        templateSetToUse, 
        agentProfileForBannerbear, 
        listing_type
      );
      console.log('Bannerbear response received:', JSON.stringify(bannerbearResponse, null, 2));
    } else {
      console.log('Using single template for image generation');
      bannerbearResponse = await generateBannerbearImage(propertyData, agentProfileForBannerbear);
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
          bedrooms: propertyData.raw?.property?.bedrooms || '',
          bathrooms: propertyData.raw?.property?.bathrooms || '',
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
          address: propertyData.raw?.property?.address || '',
          price: propertyData.raw?.property?.price || '',
          bedrooms: propertyData.raw?.property?.bedrooms || '',
          bathrooms: propertyData.raw?.property?.bathrooms || '',
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
          captionOptions: propertyData.captionOptions,
          agentProfile: agentProfileForBannerbear,
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