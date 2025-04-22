import AWS from 'aws-sdk';
import { generateTestimonialCaption } from '../../testimonial-caption-generator'; 

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Get data needed for regeneration prompt context
  const { reviewerName, reviewText, currentCaption } = req.body;

  if (!reviewText) {
    return res.status(400).json({ success: false, message: 'Missing original reviewText for context.' });
  }
  // currentCaption might be empty if regenerating initial one

  let agentProfile = null;
  // Fetch Agent Profile (same logic as generate-testimonial-caption)
  const session = req.headers.authorization?.replace('Bearer ', '');
  if (session) {
      try {
          const userResponse = await dynamoDb.query({
              TableName: USERS_TABLE,
              IndexName: 'SessionIndex',
              KeyConditionExpression: '#sess = :session',
              ExpressionAttributeNames: {'#sess': 'session'},
              ExpressionAttributeValues: {':session': session}
          }).promise(); 
          if (userResponse.Items && userResponse.Items.length > 0) {
              const userData = userResponse.Items[0];
              agentProfile = {
                  name: userData.agent_name || userData.name, 
                  email: userData.agent_email || userData.email, 
                  phone: userData.agent_phone || '' 
              };
          }
      } catch (dbError) {
          console.warn("Could not fetch agent profile for caption regeneration:", dbError);
      }
  }

  try {
    // Call the generator function, explicitly requesting regeneration and passing current caption
    console.log("Regenerating testimonial caption via API, providing current caption...");
    const newCaption = await generateTestimonialCaption(
        reviewerName, 
        reviewText, 
        agentProfile, 
        true, // isRegeneration
        currentCaption // <<< Pass current caption
    );

    if (!newCaption) {
      throw new Error('Failed to regenerate caption.');
    }
    
    // Optional: Add check to ensure it's different from currentCaption? Maybe too strict.

    return res.status(200).json({ success: true, caption: newCaption });

  } catch (error) {
    console.error("Error in /api/regenerate-testimonial-caption:", error);
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
} 