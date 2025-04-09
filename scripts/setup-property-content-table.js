const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

async function setupPropertyContentTable() {
  const tableName = 'trofai-property-content';
  
  try {
    // Check if table exists
    try {
      await dynamodb.describeTable({ TableName: tableName }).promise();
      console.log('Table already exists, verifying structure...');
    } catch (e) {
      if (e.code === 'ResourceNotFoundException') {
        // Create table if it doesn't exist
        console.log('Creating table...');
        await dynamodb.createTable({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'userId', AttributeType: 'S' }
          ],
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: 'UserIdIndex',
              KeySchema: [
                { AttributeName: 'userId', KeyType: 'HASH' }
              ],
              Projection: {
                ProjectionType: 'ALL'
              }
            }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }).promise();
        
        console.log('Waiting for table to be created...');
        await dynamodb.waitFor('tableExists', { TableName: tableName }).promise();
      } else {
        throw e;
      }
    }
    
    console.log('Table is ready!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupPropertyContentTable(); 