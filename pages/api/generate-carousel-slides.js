import AWS from 'aws-sdk';
import { generateCarouselSlides } from '../../carousel-slide-generator';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';

const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // --- Authentication ---
  const session = getSessionFromHeader(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
  }

  let userData;
  try {
    const userResponse = await dynamoDb.query({
      TableName: USERS_TABLE,
      IndexName: SESSION_INDEX,
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session }
    }).promise();

    if (!userResponse.Items || userResponse.Items.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
    }
    userData = userResponse.Items[0];
  } catch (authError) {
    console.error('generate-carousel-slides API - Authentication error:', authError);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }

  // --- Extract options from request body ---
  const {
    contentTheme,
    localFocus,
    audienceAppeal,
    toneStyle,
    mainTitle,
    mainSubtitle,
    city,
    isRegeneration,
    previousSlides
  } = req.body;

  // --- Agent details from userData ---
  const userName = userData.agent_name || userData.name || 'Your Name';
  const userEmail = userData.agent_email || userData.email || 'your@email.com';

  try {
    const slides = await generateCarouselSlides({
      contentTheme,
      localFocus,
      audienceAppeal,
      toneStyle,
      mainTitle,
      mainSubtitle,
      userName,
      userEmail,
      city,
      isRegeneration,
      previousSlides
    });
    return res.status(200).json({ success: true, slides });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate carousel slides' });
  }
} 