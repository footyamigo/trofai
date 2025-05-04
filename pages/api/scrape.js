import { scrapeProperty } from '../../scraper';
import AWS from 'aws-sdk'; // Add AWS SDK import

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLES = {
  USERS: 'trofai-users' 
};

// Helper to sanitize Realtor.com URLs by removing query params and hash
function sanitizeRealtorUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('realtor.com')) {
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    }
    return url;
  } catch (e) {
    return url;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let userData;
  let userId;
  try {
    // --- Authentication Logic (copied from process.js) --- 
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
    console.log(`[API /scrape] Authenticated user: ${userId}`);
    // --- End Authentication Logic ---
    
    const { url, listingType } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing property URL.' });
    }

    // Sanitize Realtor.com URLs
    const cleanUrl = sanitizeRealtorUrl(url);

    // Construct agentProfile from userData (similar to process.js)
    let agentProfile = null;
    if (userData.agent_name || userData.agent_email || userData.agent_phone || userData.agent_photo_url) {
        agentProfile = {
            name: userData.agent_name || userData.name || '' ,
            email: userData.agent_email || userData.email || '',
            phone: userData.agent_phone || '',
            photo_url: userData.agent_photo_url || null,
        };
        console.log(`[API /scrape] Agent profile found for user ${userId}:`, agentProfile);
    } else {
        console.log(`[API /scrape] No agent profile details found in user data for ${userId}.`);
    }

    console.log(`[API /scrape] Received scrape request for URL: ${cleanUrl}, Listing Type: ${listingType}`);

    // Call your scraping function with all arguments
    const scrapedData = await scrapeProperty(cleanUrl, listingType, agentProfile);

    // Check if scraping was successful 
    if (!scrapedData || scrapedData.error) {
        console.error(`[API /scrape] Scraping failed for URL: ${cleanUrl}`, scrapedData?.error);
        throw new Error(scrapedData?.error || 'Failed to scrape property data.');
    }

    console.log(`[API /scrape] Scraping successful for URL: ${cleanUrl}`);
    // Return only the scraped data
    res.status(200).json({ success: true, scrapedData });

  } catch (error) {
    console.error(`[API /scrape] Error: ${error.message}`, error.stack);
    // Distinguish auth errors from scraping errors
    if (error.message.includes('Unauthorized')) {
        return res.status(401).json({ success: false, error: error.message });
    }
    res.status(500).json({ 
      success: false, 
      error: `Scraping failed: ${error.message || 'Internal Server Error'}` 
    });
  }
} 