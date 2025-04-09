import { withSSRContext } from 'aws-amplify';
import { propertiesDb } from '../../../src/aws/dynamoDb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current authenticated user
    const SSR = withSSRContext({ req });
    let user;
    
    try {
      user = await SSR.Auth.currentAuthenticatedUser();
    } catch (error) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = user.username;
    
    // Get properties from DynamoDB
    const properties = await propertiesDb.getPropertiesByUser(userId);

    return res.status(200).json({
      success: true,
      properties,
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting properties',
      error: error.message,
    });
  }
} 