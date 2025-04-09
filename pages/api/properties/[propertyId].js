import { withSSRContext } from 'aws-amplify';
import { propertiesDb } from '../../../src/aws/dynamoDb';

export default async function handler(req, res) {
  const { propertyId } = req.query;

  if (!propertyId) {
    return res.status(400).json({ message: 'Property ID is required' });
  }

  // Get the current authenticated user
  const SSR = withSSRContext({ req });
  let user;
  
  try {
    user = await SSR.Auth.currentAuthenticatedUser();
  } catch (error) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = user.username;

  // Handle GET request - get a single property
  if (req.method === 'GET') {
    try {
      const property = await propertiesDb.getPropertyById(propertyId, userId);
      
      if (!property) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        property,
      });
    } catch (error) {
      console.error('Error getting property:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting property',
        error: error.message,
      });
    }
  }
  
  // Handle DELETE request - delete a property
  else if (req.method === 'DELETE') {
    try {
      // Check if property exists and belongs to the user
      const property = await propertiesDb.getPropertyById(propertyId, userId);
      
      if (!property) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property not found or you do not have permission to delete it' 
        });
      }
      
      // Delete the property
      await propertiesDb.deleteProperty(propertyId, userId);
      
      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting property:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting property',
        error: error.message,
      });
    }
  }
  
  // Handle unsupported methods
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
} 