require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const dynamodb = new AWS.DynamoDB();

const createTableParams = {
  TableName: 'trofai-image-status',
  KeySchema: [
    { AttributeName: 'uid', KeyType: 'HASH' }  // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: 'uid', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

const ttlParams = {
  TableName: 'trofai-image-status',
  TimeToLiveSpecification: {
    AttributeName: 'ttl',
    Enabled: true
  }
};

async function setupTable() {
  try {
    // Create table
    console.log('Creating table...');
    const createResult = await dynamodb.createTable(createTableParams).promise();
    console.log('Table created successfully:', createResult);

    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: 'trofai-image-status' }).promise();
    
    // Enable TTL
    console.log('Enabling TTL...');
    const ttlResult = await dynamodb.updateTimeToLive(ttlParams).promise();
    console.log('TTL enabled successfully:', ttlResult);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Table already exists, enabling TTL...');
      try {
        const ttlResult = await dynamodb.updateTimeToLive(ttlParams).promise();
        console.log('TTL enabled successfully:', ttlResult);
      } catch (ttlError) {
        if (ttlError.code === 'ValidationException' && ttlError.message.includes('TimeToLive is already enabled')) {
          console.log('TTL is already enabled');
        } else {
          console.error('Error enabling TTL:', ttlError);
        }
      }
    } else {
      console.error('Error creating table:', error);
    }
  }
}

setupTable(); 