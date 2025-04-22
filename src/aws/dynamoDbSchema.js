/*
 * DynamoDB Schema Definition
 * 
 * This file defines the table structures for our AWS DynamoDB database.
 * It includes the primary keys, indexes, and attribute definitions.
 */

const tables = {
  // Users table - stores user profile information
  users: {
    tableName: process.env.DYNAMODB_USERS_TABLE || 'trofai-users',
    partitionKey: 'userId', // Cognito user ID
    indexes: {
      // GSI to query users by email
      byEmail: {
        indexName: 'email-index',
        partitionKey: 'email',
      },
      // GSI to query users by username
      byUsername: {
        indexName: 'username-index',
        partitionKey: 'username',
      },
      // GSI to query users by session token
      bySession: {
        indexName: 'SessionIndex',
        partitionKey: 'session',
      },
    },
    attributes: {
      userId: 'S',
      email: 'S',
      username: 'S',
      session: 'S',
      properties: 'L',
      agent_name: 'S',
      agent_phone: 'S',
      agent_photo_url: 'S',
      createdAt: 'S',
      updatedAt: 'S'
    }
  },

  // Properties table - stores property data
  properties: {
    tableName: process.env.DYNAMODB_PROPERTIES_TABLE || 'trofai-properties',
    partitionKey: 'propertyId', // UUID for the property
    sortKey: 'userId', // The user who saved/created the property
    indexes: {
      // GSI to query properties by user
      byUser: {
        indexName: 'userId-createdAt-index',
        partitionKey: 'userId',
        sortKey: 'createdAt',
      },
      // GSI to query properties by address (for potential duplicates)
      byAddress: {
        indexName: 'address-index',
        partitionKey: 'address',
      },
    },
  },

  // Designs table - stores design data
  designs: {
    tableName: process.env.DYNAMODB_DESIGNS_TABLE || 'trofai-designs',
    partitionKey: 'designId', // UUID for the design
    sortKey: 'userId', // The user who created the design
    indexes: {
      // GSI to query designs by user
      byUser: {
        indexName: 'userId-createdAt-index',
        partitionKey: 'userId',
        sortKey: 'createdAt',
      },
      // GSI to query designs by property
      byProperty: {
        indexName: 'propertyId-index',
        partitionKey: 'propertyId',
      },
    },
  },

  // Social Captions table - stores generated captions
  captions: {
    tableName: process.env.DYNAMODB_CAPTIONS_TABLE || 'trofai-captions',
    partitionKey: 'captionId', // UUID for the caption
    sortKey: 'userId', // The user who generated the caption
    indexes: {
      // GSI to query captions by user
      byUser: {
        indexName: 'userId-createdAt-index',
        partitionKey: 'userId',
        sortKey: 'createdAt',
      },
      // GSI to query captions by design
      byDesign: {
        indexName: 'designId-index',
        partitionKey: 'designId',
      },
      // GSI to query captions by property
      byProperty: {
        indexName: 'propertyId-index',
        partitionKey: 'propertyId',
      },
    },
  },
};

export default tables; 