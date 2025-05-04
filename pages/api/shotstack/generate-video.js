// Ensure .env variables are loaded (especially for serverless functions)
require('dotenv').config();

import AWS from 'aws-sdk'; // Add AWS SDK
import crypto from 'crypto'; // Add crypto for IDs

// import path from 'path';
// Adjust the path based on your project structure. 
// Assuming pages/api/shotstack/ is two levels down from the root where scripts/ is.
// const generateVideoScriptPath = path.join(process.cwd(), 'scripts', 'generate-shotstack-video-template.js');
// const { generateVideoFromTemplate } = require(generateVideoScriptPath);

// Use static relative path for better compatibility with Next.js build
const { generateVideoFromTemplate } = require('../../../scripts/generate-shotstack-video-template.js');

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLES = {
  PROPERTIES: 'trofai-properties',
  USERS: 'trofai-users',
  PROPERTY_CONTENT: 'trofai-property-content'
  // Add other tables if needed later (e.g., for video-specific tracking)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let userData;
  let userId;
  try {
    // --- Authentication Logic (copied from /api/process) --- 
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ success: false, error: 'Unauthorized - No session provided' });
    }
    const userResponse = await dynamoDb.query({
      TableName: TABLES.USERS,
      IndexName: 'SessionIndex',
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session }
    }).promise();
    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ success: false, error: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0];
    userId = userData.userId;
    console.log(`[API /generate-video] Authenticated user: ${userId}`);
    // --- End Authentication Logic ---

    const { scrapedData, listingType, templateId } = req.body;

    // Basic validation
    if (!scrapedData || !listingType || !templateId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: scrapedData, listingType, or templateId.' });
    }

    // Check if the imported function exists
    if (typeof generateVideoFromTemplate !== 'function') {
       console.error('generateVideoFromTemplate function not imported correctly');
       return res.status(500).json({ success: false, error: 'Video generation function not available.' });
    }

    // Ensure scrapedData.raw exists and has the necessary structure (basic check)
    if (!scrapedData.raw || !scrapedData.raw.property || !scrapedData.raw.agent) {
        console.error('API: Invalid scrapedData structure. Missing raw, raw.property, or raw.agent.', scrapedData);
        return res.status(400).json({ success: false, error: 'Invalid scraped data structure received.' });
    }

    try {
      console.log(`API: Received request to generate video with template ID: ${templateId}`);
      const videoUrl = await generateVideoFromTemplate(scrapedData.raw, listingType, templateId);
      console.log(`API: Video generated successfully: ${videoUrl}`);

      // --- Save results to DynamoDB --- 
      const propertyId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const propertyDataForDB = scrapedData.raw.property || {}; // Extract property details
      const addressValue = propertyDataForDB.address || '';

      // 1. PROPERTY_CONTENT table
      const propertyContentItem = {
        id: propertyId,
        userId: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        propertyData: scrapedData, // Store the full scraped data (including raw)
        status: 'completed', // Video generation is synchronous here
        price: propertyDataForDB.price || '',
        bedrooms: propertyDataForDB.bedrooms ?? null,
        bathrooms: propertyDataForDB.bathrooms ?? null,
        templateId: templateId, // Shotstack Template ID used
        videoUrl: videoUrl, // Store the generated video URL
        address: addressValue,
        type: 'video' // Add type identifier
      };
      await dynamoDb.put({
        TableName: TABLES.PROPERTY_CONTENT,
        Item: propertyContentItem
      }).promise();

      // 2. PROPERTIES table (for History List)
      const propertySummaryItem = {
        propertyId: propertyId,
        userId: userId,
        url: req.body.url, // Get original URL from request body
        address: addressValue,
        price: propertyDataForDB.price || '',
        bedrooms: propertyDataForDB.bedrooms ?? null,
        bathrooms: propertyDataForDB.bathrooms ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'completed', // Video status is completed
        type: 'video' // Add type identifier
      };
      await dynamoDb.put({
        TableName: TABLES.PROPERTIES,
        Item: propertySummaryItem
      }).promise();

      // 3. Update USER properties list
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
          console.warn('[API /generate-video] Failed to update user properties list:', userUpdateError);
          // Optionally add fallback PUT logic if needed, similar to /api/process
      }

      console.log(`[API /generate-video] Successfully saved video details to DynamoDB for propertyId: ${propertyId}`);

      return res.status(200).json({ 
          success: true, 
          videoUrl, 
          propertyId // Return propertyId 
      });

    } catch (error) {
      console.error('API: Error during Shotstack video generation:', error);
      return res.status(500).json({ 
        success: false, 
        error: `Failed to generate video: ${error.message || 'Unknown error'}` 
      });
    }
  } catch (error) {
    console.error('API: Error during authentication:', error);
    return res.status(500).json({ success: false, error: 'Failed to authenticate user' });
  }
} 