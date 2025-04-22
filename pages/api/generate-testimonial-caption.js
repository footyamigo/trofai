import AWS from 'aws-sdk';
import { generateTestimonialCaption } from '../../testimonial-caption-generator'; // Import the new generator

// Initialize DynamoDB (if needed for agent profile - optional for this endpoint)
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { reviewerName, reviewText } = req.body;

  if (!reviewText) {
    return res.status(400).json({ success: false, message: 'Missing reviewText in request body.' });
  }

  let agentProfile = null; 
  // --- UNCOMMENTED and ADAPTED: Fetch Agent Profile --- 
  const session = req.headers.authorization?.replace('Bearer ', '');
  if (session) {
      try {
          // Query using the SessionIndex to find the user by session token
          const userResponse = await dynamoDb.query({
              TableName: USERS_TABLE,
              IndexName: 'SessionIndex',
              KeyConditionExpression: '#sess = :session',
              ExpressionAttributeNames: {'#sess': 'session'},
              ExpressionAttributeValues: {':session': session}
          }).promise(); 

          if (userResponse.Items && userResponse.Items.length > 0) {
              const userData = userResponse.Items[0];
              console.log("Agent profile found for caption generation:", userData.userId);
              // Extract needed details for the caption generator function
              agentProfile = {
                  name: userData.agent_name || userData.name, // Use agent name or fallback to user name
                  email: userData.agent_email || userData.email, // Use agent email or fallback to user email
                  phone: userData.agent_phone || '' // Use agent phone number
              };
          } else {
               console.warn("No user found for the provided session token.");
          }
      } catch (dbError) {
          console.warn("Could not fetch agent profile for caption generation:", dbError);
          // Proceed without agent profile, defaults will be used in the generator
      }
  } else {
       console.warn("No session token provided, cannot fetch agent profile.");
  }
  // --- End Agent Profile Fetch ---

  try {
    // Pass the potentially fetched agentProfile to the generator
    const caption = await generateTestimonialCaption(reviewerName, reviewText, agentProfile);

    if (!caption) {
      throw new Error('Failed to generate caption.');
    }

    return res.status(200).json({ success: true, caption: caption });

  } catch (error) {
    console.error("Error in /api/generate-testimonial-caption:", error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
} 