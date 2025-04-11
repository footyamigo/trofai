import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Initialize DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Define table names
const TABLES = {
  PROPERTIES: 'trofai-properties',
  PROPERTY_CONTENT: 'trofai-property-content',
  USERS: 'trofai-users'
};

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ 
        success: false,
        message: 'Property ID is required' 
      });
    }

    // Get the user from the session token
    const session = req.headers.authorization?.replace('Bearer ', '');
    if (!session) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - No session provided' 
      });
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
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - Invalid session' 
      });
    }

    const userId = userResponse.Items[0].userId;
    
    console.log(`Attempting to delete property ${propertyId} for user ${userId}`);

    // First, scan the table to find the item and understand its key structure
    try {
      // Scan to find the item by propertyId
      console.log('Performing scan to find property and determine key structure');
      const scanResult = await dynamoDb.scan({
        TableName: TABLES.PROPERTIES,
        FilterExpression: 'propertyId = :pid OR id = :pid',
        ExpressionAttributeValues: {
          ':pid': propertyId
        }
      }).promise();
      
      console.log(`Scan results count: ${scanResult.Items ? scanResult.Items.length : 0}`);
      
      if (!scanResult.Items || scanResult.Items.length === 0) {
        console.log(`Property ${propertyId} not found in PROPERTIES table`);
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Found the item - log it for debugging
      const item = scanResult.Items[0];
      console.log('Found property item structure:', JSON.stringify(item, null, 2));
      
      // Check if user owns this property
      if (item.userId !== userId) {
        console.log(`User ${userId} does not own property ${propertyId}`);
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this property'
        });
      }
      
      // Determine the key structure by attempting different known patterns
      let deleteParams = null;
      
      // Try different key combinations based on observed patterns in the data
      if (item.url) {
        // Try with url as the key
        console.log('Attempting to delete with url as key');
        deleteParams = {
          TableName: TABLES.PROPERTIES,
          Key: { url: item.url }
        };
      } else if (item.propertyId && item.createdAt) {
        // Try with propertyId + createdAt composite key
        console.log('Attempting to delete with propertyId + createdAt as composite key');
        deleteParams = {
          TableName: TABLES.PROPERTIES,
          Key: { 
            propertyId: item.propertyId,
            createdAt: item.createdAt 
          }
        };
      } else if (item.propertyId) {
        // Try with just propertyId as key
        console.log('Attempting to delete with propertyId as key');
        deleteParams = {
          TableName: TABLES.PROPERTIES,
          Key: { propertyId: item.propertyId }
        };
      } else if (item.id) {
        // Try with id as key
        console.log('Attempting to delete with id as key');
        deleteParams = {
          TableName: TABLES.PROPERTIES,
          Key: { id: item.id }
        };
      } else {
        // Can't determine key structure
        console.error('Cannot determine key structure:', item);
        throw new Error('Cannot determine key structure for deletion');
      }
      
      console.log('Delete params:', JSON.stringify(deleteParams, null, 2));
      
      // Now attempt the delete operation with the determined key structure
      await dynamoDb.delete(deleteParams).promise();
      console.log(`Successfully deleted property from PROPERTIES table`);
      
    } catch (error) {
      console.error(`Error deleting from PROPERTIES table:`, error);
      
      // If we still have issues, try one more fallback approach with a bare minimum implementation
      if (error.code === 'ValidationException') {
        console.error('Key schema validation error even after detection attempt. Trying emergency fallback.');
        
        try {
          // Direct table item deletion with additional logging
          const describeTable = new AWS.DynamoDB().describeTable({ 
            TableName: 'trofai-properties' 
          }).promise();
          
          const tableInfo = await describeTable;
          console.log('Table structure:', JSON.stringify(tableInfo.Table.KeySchema, null, 2));
          
          // If we can determine the key structure from the table description, use it
          if (tableInfo && tableInfo.Table && tableInfo.Table.KeySchema) {
            const keySchema = tableInfo.Table.KeySchema;
            console.log('Found key schema:', keySchema);
            
            // Try again with the correct key structure
            const scanResult = await dynamoDb.scan({
              TableName: TABLES.PROPERTIES,
              FilterExpression: 'propertyId = :pid',
              ExpressionAttributeValues: {
                ':pid': propertyId
              }
            }).promise();
            
            if (scanResult.Items && scanResult.Items.length > 0) {
              const item = scanResult.Items[0];
              const key = {};
              
              // Build the key based on the schema
              keySchema.forEach(keyDef => {
                key[keyDef.AttributeName] = item[keyDef.AttributeName];
              });
              
              console.log('Using emergency key structure for delete:', key);
              
              await dynamoDb.delete({
                TableName: TABLES.PROPERTIES,
                Key: key
              }).promise();
              
              console.log('Emergency delete successful');
            }
          }
        } catch (fallbackError) {
          console.error('Emergency fallback delete approach failed:', fallbackError);
          
          // Return a more detailed error to help diagnose the issue
          return res.status(500).json({
            success: false,
            message: 'Could not delete property due to key schema issues',
            error: `Primary Error: ${error.message}, Fallback Error: ${fallbackError.message}`,
            propertyId: propertyId,
            userId: userId
          });
        }
      } else {
        // Return a standard error for non-schema related issues
        return res.status(500).json({
          success: false,
          message: 'Error deleting property',
          error: error.message
        });
      }
    }

    // Delete from PROPERTY_CONTENT table
    try {
      await dynamoDb.delete({
        TableName: TABLES.PROPERTY_CONTENT,
        Key: {
          id: propertyId
        }
      }).promise();
      console.log(`Deleted property ${propertyId} from PROPERTY_CONTENT table`);
    } catch (error) {
      console.warn(`Error deleting from PROPERTY_CONTENT: ${error.message}`);
      // We'll continue even if this fails as the main record is already deleted
    }

    // Remove the property from the user's properties list
    try {
      // First get the current user to find the index of the property in the array
      const user = userResponse.Items[0];
      
      if (user.properties && Array.isArray(user.properties)) {
        const propertyIndex = user.properties.indexOf(propertyId);
        
        if (propertyIndex !== -1) {
          // Remove the property from the array
          const updatedProperties = [
            ...user.properties.slice(0, propertyIndex),
            ...user.properties.slice(propertyIndex + 1)
          ];
          
          // Update the user record
          await dynamoDb.update({
            TableName: TABLES.USERS,
            Key: { userId: userId },
            UpdateExpression: 'SET properties = :properties',
            ExpressionAttributeValues: {
              ':properties': updatedProperties
            }
          }).promise();
          
          console.log(`Removed property ${propertyId} from user's properties list`);
        }
      }
    } catch (error) {
      console.warn(`Error updating user's property list: ${error.message}`);
      // We'll continue even if this fails as the main record is already deleted
    }

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
} 