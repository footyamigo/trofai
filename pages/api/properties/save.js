import { withSSRContext } from 'aws-amplify';
import { propertiesDb } from '../../../src/aws/dynamoDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const propertyData = req.body;

    // Validate required fields
    if (!propertyData.address) {
      return res.status(400).json({ message: 'Property address is required' });
    }

    // Add additional metadata
    const propertyToSave = {
      ...propertyData,
      savedAt: new Date().toISOString(),
    };

    // Save to DynamoDB
    const result = await propertiesDb.createProperty(userId, propertyToSave);

    return res.status(200).json({
      success: true,
      message: 'Property saved successfully',
      propertyId: result.propertyId,
    });
  } catch (error) {
    console.error('Error saving property:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving property',
      error: error.message,
    });
  }
} 