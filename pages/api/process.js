// Import AWS SDK
import AWS from 'aws-sdk';
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

// Main API handler - Modified for Bannerbear Generation Only
export default async function handler(req, res) {
  console.log('[API /process] Starting Bannerbear generation request');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let userData;
  let userId;
  try {
    // --- Authentication Logic (Direct DynamoDB lookup) --- 
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - No session provided' });
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
      return res.status(401).json({ error: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0]; // Store user data
    userId = userData.userId;
    console.log(`[API /process] Authenticated user: ${userId}`);
    // --- End Authentication Logic ---
    
    // Extract data needed for Bannerbear generation from the request body
    const { scrapedData, templateId, listing_type } = req.body;

    // Validate required inputs
    if (!scrapedData) {
      return res.status(400).json({ error: 'Missing scrapedData.' });
    }
    if (!templateId) {
      return res.status(400).json({ error: 'Missing templateId (Bannerbear Template Set UID).' });
    }
    // listing_type is optional but log if present
    if (listing_type) {
      console.log(`[API /process] Listing type provided: ${listing_type}`);
    }

    // Extract Agent Profile Data from authenticated user data (only if agent flow was indicated during scrape? TBD)
    // For now, assume agent flow if agent details exist in userData
    let agentProfileForBannerbear = null;
    if (userData.agent_name || userData.agent_email || userData.agent_phone || userData.agent_photo_url) {
        agentProfileForBannerbear = {
            name: userData.agent_name || userData.name || '' ,
            email: userData.agent_email || userData.email || '',
            phone: userData.agent_phone || '',
            photo_url: userData.agent_photo_url || null,
        };
        console.log(`[API /process] Agent profile found. Passing to Bannerbear:`, agentProfileForBannerbear);
    } else {
        console.log('[API /process] No agent profile found in user data.');
    }

    // --- Bannerbear Generation --- 
    console.log('[API /process] Initiating Bannerbear collection generation with template set:', templateId);
    
    // Use the scrapedData directly
    const bannerbearResponse = await generateBannerbearCollection(
      scrapedData, 
      templateId, 
        agentProfileForBannerbear, 
        listing_type
      );
    
    if (!bannerbearResponse) {
        console.error('[API /process] generateBannerbearCollection returned null or undefined');
        throw new Error('Failed to initiate Bannerbear collection generation.');
    }
    console.log('[API /process] Bannerbear response received:', JSON.stringify(bannerbearResponse, null, 2));
    
    // --- DynamoDB Storage --- 
    const propertyId = crypto.randomUUID(); // Generate a unique ID for this content instance
    const timestamp = new Date().toISOString();

    // Add propertyId to metadata for webhook/polling reference
      bannerbearResponse.metadata = {
        ...(bannerbearResponse.metadata || {}),
        propertyId: propertyId
      };

    try {
      // Store data in DynamoDB (similar logic as before, but using scrapedData)
      const propertyDataForDB = scrapedData.raw || scrapedData; // Use raw if available
      const addressValue = propertyDataForDB?.property?.location || propertyDataForDB?.property?.address || ''; 

      // 1. PROPERTY_CONTENT table
      const propertyContentItem = {
        id: propertyId,
        userId: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        propertyData: scrapedData, // Store the full scraped data
        status: 'pending', // Initial status before polling completes
        price: propertyDataForDB?.property?.price || '',
        bedrooms: propertyDataForDB?.property?.bedrooms ?? null,
        bathrooms: propertyDataForDB?.property?.bathrooms ?? null,
        templateId: templateId,
        bannerbear: bannerbearResponse, // Store initial BB response
        address: addressValue
      };
      await dynamoDb.put({
        TableName: TABLES.PROPERTY_CONTENT,
        Item: propertyContentItem
      }).promise();

      // 2. DESIGNS table (tracks the Bannerbear job)
      const designsItem = {
        uid: bannerbearResponse.uid,
        designId: bannerbearResponse.uid,
        propertyId,
        userId: userId,
        status: bannerbearResponse.status || 'pending',
        type: bannerbearResponse.template_set ? 'collection' : 'image',
        templateId: templateId,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...bannerbearResponse
      };
      await dynamoDb.put({
        TableName: TABLES.DESIGNS,
        Item: designsItem
      }).promise();

      // 3. CAPTIONS table
      const captionId = crypto.randomUUID();
      await dynamoDb.put({
        TableName: TABLES.CAPTIONS,
        Item: {
          captionId,
          userId,
          propertyId,
          designId: bannerbearResponse.uid,
          caption: scrapedData.caption || '', // Get caption from scraped data
          captionOptions: scrapedData.captionOptions || {},
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }).promise();

      // 4. IMAGE_STATUS table (initial status)
      await dynamoDb.put({
        TableName: TABLES.IMAGE_STATUS,
        Item: {
          uid: bannerbearResponse.uid,
          imageId: bannerbearResponse.uid,
          propertyId,
          userId: userId,
          status: bannerbearResponse.status || 'pending',
          createdAt: timestamp,
          updatedAt: timestamp,
          ...bannerbearResponse
        }
      }).promise();

      // 5. **NEW**: Save summary to PROPERTIES table for History List
      const propertySummaryItem = {
        propertyId: propertyId,
        userId: userId,
        url: req.body.url, // Get original URL from request body
        address: addressValue,
        price: propertyDataForDB?.property?.price || '',
        bedrooms: propertyDataForDB?.property?.bedrooms ?? null,
        bathrooms: propertyDataForDB?.property?.bathrooms ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'pending' // Initial status for history
      };
      await dynamoDb.put({
        TableName: TABLES.PROPERTIES,
        Item: propertySummaryItem
      }).promise();

      // 6. Update USER properties list (add propertyId)
      // (Keep existing robust logic for updating user properties)
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
          console.warn('[API /process] Failed to update user properties list, attempting PUT:', userUpdateError);
          // Fallback to PUT if update fails (e.g., properties list doesn't exist)
          const existingUserData = await dynamoDb.get({ TableName: TABLES.USERS, Key: { userId } }).promise();
          const existingProperties = existingUserData.Item?.properties || [];
          if (!existingProperties.includes(propertyId)) { // Avoid duplicates
             await dynamoDb.update({
          TableName: TABLES.USERS,
               Key: { userId: userId },
               UpdateExpression: 'SET properties = :props',
               ExpressionAttributeValues: { ':props': [...existingProperties, propertyId] }
        }).promise();
           }
      }

      console.log('[API /process] Successfully saved initial Bannerbear response to DynamoDB');
      
      // --- Start Polling --- 
      console.log('[API /process] Starting background polling for Bannerbear status');
      pollBannerbearStatus(
        bannerbearResponse.uid, 
        propertyId, 
        !!bannerbearResponse.template_set
      ).catch(error => {
        console.error('[API /process] Error in background polling:', error);
      });

      // --- Return Initial Response --- 
      // Send back the initial response including the UID for the frontend to poll
      return res.status(200).json({
        success: true,
        message: 'Bannerbear generation initiated successfully.',
        data: {
          propertyId,
          bannerbear: {
            uid: bannerbearResponse.uid,
            status: bannerbearResponse.status || 'pending',
            type: bannerbearResponse.template_set ? 'collection' : 'image'
          },
          // Include caption data from scrapedData
          caption: scrapedData.caption || '',
          captionOptions: scrapedData.captionOptions || {},
          // Optionally include minimal property details if needed by frontend immediately
          property: {
            address: addressValue,
            price: propertyDataForDB?.property?.price || ''
          }
        }
      });

    } catch (dbError) {
      console.error('[API /process] Failed to store data in DynamoDB:', dbError);
      // Attempt to clean up Bannerbear job if DB write fails?
      throw new Error(`Failed to store processing data: ${dbError.message}`); // Throw to be caught by outer try/catch
    }
    
  } catch (error) {
    console.error('[API /process] Error in main handler:', error);
     // Distinguish auth errors from other processing errors
    if (error.message.includes('Unauthorized')) {
        return res.status(401).json({ success: false, error: error.message });
    }
    res.status(500).json({ 
        success: false,
        error: `Processing failed: ${error.message || 'Internal Server Error'}` 
    });
  }
} 