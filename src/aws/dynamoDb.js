import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import tables from './dynamoDbSchema';
import { v4 as uuidv4 } from 'uuid';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create document client
const docClient = DynamoDBDocumentClient.from(client);

// Generic DynamoDB operations
export const dynamoDb = {
  // Put an item into a table
  put: async (tableName, item) => {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });
    return docClient.send(command);
  },

  // Get an item from a table by key
  get: async (tableName, key) => {
    const command = new GetCommand({
      TableName: tableName,
      Key: key,
    });
    return docClient.send(command);
  },

  // Query items from a table
  query: async (tableName, params) => {
    const command = new QueryCommand({
      TableName: tableName,
      ...params,
    });
    return docClient.send(command);
  },

  // Delete an item from a table
  delete: async (tableName, key) => {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    });
    return docClient.send(command);
  },

  // Update an item in a table
  update: async (tableName, key, params) => {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      ...params,
    });
    return docClient.send(command);
  },
};

// User-specific operations
export const usersDb = {
  // Create a new user profile
  createUser: async (userId, userData) => {
    const item = {
      userId,
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData,
    };
    return dynamoDb.put(tables.users.tableName, item);
  },

  // Get a user by ID
  getUserById: async (userId) => {
    const result = await dynamoDb.get(tables.users.tableName, { userId });
    return result.Item;
  },

  // Get a user by email
  getUserByEmail: async (email) => {
    const params = {
      IndexName: tables.users.indexes.byEmail.indexName,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };
    const result = await dynamoDb.query(tables.users.tableName, params);
    return result.Items?.[0];
  },

  // Get a user by username
  getUserByUsername: async (username) => {
    const params = {
      IndexName: tables.users.indexes.byUsername.indexName,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
    };
    const result = await dynamoDb.query(tables.users.tableName, params);
    return result.Items?.[0];
  },

  // Update a user profile
  updateUser: async (userId, updates) => {
    let updateExpression = 'set ';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build the update expression
    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
      
      updateExpression += `${attrName} = ${attrValue}, `;
    });

    // Add updated timestamp
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    updateExpression += '#updatedAt = :updatedAt';

    const params = {
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    return dynamoDb.update(tables.users.tableName, { userId }, params);
  },
};

// Property-specific operations
export const propertiesDb = {
  // Create a new property
  createProperty: async (userId, propertyData) => {
    const propertyId = uuidv4();
    const item = {
      propertyId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...propertyData,
    };
    return dynamoDb.put(tables.properties.tableName, item);
  },

  // Get a property by ID
  getPropertyById: async (propertyId, userId) => {
    const result = await dynamoDb.get(tables.properties.tableName, { propertyId, userId });
    return result.Item;
  },

  // Get all properties for a user
  getPropertiesByUser: async (userId) => {
    const params = {
      IndexName: tables.properties.indexes.byUser.indexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt in descending order (newest first)
    };
    const result = await dynamoDb.query(tables.properties.tableName, params);
    return result.Items;
  },

  // Delete a property
  deleteProperty: async (propertyId, userId) => {
    return dynamoDb.delete(tables.properties.tableName, { propertyId, userId });
  },

  // Update a property
  updateProperty: async (propertyId, userId, updates) => {
    let updateExpression = 'set ';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build the update expression
    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
      
      updateExpression += `${attrName} = ${attrValue}, `;
    });

    // Add updated timestamp
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    updateExpression += '#updatedAt = :updatedAt';

    const params = {
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    return dynamoDb.update(tables.properties.tableName, { propertyId, userId }, params);
  },
};

// Design-specific operations
export const designsDb = {
  // Create a new design
  createDesign: async (userId, designData) => {
    const designId = uuidv4();
    const item = {
      designId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...designData,
    };
    return dynamoDb.put(tables.designs.tableName, item);
  },

  // Get a design by ID
  getDesignById: async (designId, userId) => {
    const result = await dynamoDb.get(tables.designs.tableName, { designId, userId });
    return result.Item;
  },

  // Get all designs for a user
  getDesignsByUser: async (userId) => {
    const params = {
      IndexName: tables.designs.indexes.byUser.indexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt in descending order (newest first)
    };
    const result = await dynamoDb.query(tables.designs.tableName, params);
    return result.Items;
  },

  // Get all designs for a property
  getDesignsByProperty: async (propertyId) => {
    const params = {
      IndexName: tables.designs.indexes.byProperty.indexName,
      KeyConditionExpression: 'propertyId = :propertyId',
      ExpressionAttributeValues: {
        ':propertyId': propertyId,
      },
    };
    const result = await dynamoDb.query(tables.designs.tableName, params);
    return result.Items;
  },

  // Delete a design
  deleteDesign: async (designId, userId) => {
    return dynamoDb.delete(tables.designs.tableName, { designId, userId });
  },
};

// Caption-specific operations
export const captionsDb = {
  // Create a new caption
  createCaption: async (userId, captionData) => {
    const captionId = uuidv4();
    const item = {
      captionId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...captionData,
    };
    return dynamoDb.put(tables.captions.tableName, item);
  },

  // Get a caption by ID
  getCaptionById: async (captionId, userId) => {
    const result = await dynamoDb.get(tables.captions.tableName, { captionId, userId });
    return result.Item;
  },

  // Get all captions for a user
  getCaptionsByUser: async (userId) => {
    const params = {
      IndexName: tables.captions.indexes.byUser.indexName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort by createdAt in descending order (newest first)
    };
    const result = await dynamoDb.query(tables.captions.tableName, params);
    return result.Items;
  },

  // Get all captions for a design
  getCaptionsByDesign: async (designId) => {
    const params = {
      IndexName: tables.captions.indexes.byDesign.indexName,
      KeyConditionExpression: 'designId = :designId',
      ExpressionAttributeValues: {
        ':designId': designId,
      },
    };
    const result = await dynamoDb.query(tables.captions.tableName, params);
    return result.Items;
  },

  // Delete a caption
  deleteCaption: async (captionId, userId) => {
    return dynamoDb.delete(tables.captions.tableName, { captionId, userId });
  },
};

export default {
  dynamoDb,
  usersDb,
  propertiesDb,
  designsDb,
  captionsDb,
}; 