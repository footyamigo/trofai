const { GoogleGenerativeAI } = require('@google/generative-ai');
const AWS = require('aws-sdk'); // Added AWS SDK

// Configure AWS SDK (use environment variables)
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION || 'us-east-1'
});

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users'; // Define user table name

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Updated model

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get session token from headers
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized - No session provided' });
    }

    // 2. Fetch user data from DynamoDB using session
    let userData;
    try {
      const userResponse = await dynamoDb.query({
        TableName: USERS_TABLE,
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
      userData = userResponse.Items[0];
    } catch (dbError) {
      console.error('Error fetching user data from DynamoDB:', dbError);
      return res.status(500).json({ error: 'Failed to retrieve user data' });
    }

    // 3. Extract data from request body (excluding agentProfile/isAgentFlow)
    const { propertyDetails, currentCaption, listingType } = req.body;

    if (!propertyDetails) {
      return res.status(400).json({ error: 'Property details are required for regeneration' });
    }
    
    // 4. Extract agent details directly from fetched userData
    const agentName = userData.agent_name || userData.name || "Your Name"; // Fallback to user name then placeholder
    const agentEmail = userData.agent_email || userData.email || "your.email@example.com"; // Fallback to user email then placeholder
    const agentPhone = userData.agent_phone || "Your Phone Number"; // Fallback to placeholder
    
    console.log(`Regenerating caption for agent: ${agentName}`); // Log the fetched agent name
    
    // 5. Construct the prompt using fetched agent details and listingType
    const fullPrompt = `You are ${agentName}, an expert real estate copywriter. Rewrite the following social media post for YOUR listing to make it more compelling, detailed, and professional, while reducing emoji usage.

IMPORTANT: The listing type is: ${listingType || 'Just Listed'}.
Start the caption with a hook or phrase that matches this listing type (e.g., 'Just Listed!', 'Just Sold!', 'For Rent', 'Let Agreed', etc.) and keep the context throughout the caption.

Your tone should be:
- Professional, knowledgeable, and enthusiastic.
- Focused on highlighting the unique value proposition and lifestyle appeal.
- Evocative, painting a picture of living in the property and neighborhood.

Property Details (For Context):
- Location: ${propertyDetails.address}
- Price: ${propertyDetails.price}
- Layout: ${propertyDetails.bedrooms} bedrooms, ${propertyDetails.bathrooms} bathrooms
- Key Features: ${propertyDetails.keyFeatures}

Original Post (Rewrite this):
${currentCaption || ''}

Your Contact Info (Use these details):
- Name: ${agentName} 
- Email: ${agentEmail}
- Phone: ${agentPhone}

Rewrite Requirements:
- Improve the hook and overall narrative flow.
- Incorporate more specific details about the property's Key Features and the lifestyle they offer.
- Briefly mention specific nearby amenities or the neighborhood vibe based on the Location (${propertyDetails.address}).
- Maintain a sophisticated and aspirational tone.
- Use only 2-4 relevant emojis sparingly.
- Ensure 3-5 relevant and specific hashtags are present.
- End with a clear, professional call-to-action inviting interested buyers to contact YOU directly. Format it like this: 'Contact me for details: 📧 ${agentEmail} 📞 ${agentPhone}'. Do not include your name in the CTA.
- Structure for readability (short paragraphs).
- Strictly NO ASTERISKS or markdown formatting.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedCaption = response.text().trim().replace(/\*/g, '');

    return res.status(200).json({ caption: generatedCaption });
  } catch (error) {
    console.error('Error regenerating caption with Google Gemini:', error);
    // Add more specific error handling if desired
    if (error.message && error.message.includes('API key not valid')) {
      return res.status(500).json({ error: 'Google API key error. Please check configuration.' });
    }
    return res.status(500).json({ error: 'Failed to regenerate caption. Please try again.' });
  }
} 