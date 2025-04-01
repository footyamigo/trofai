const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create DynamoDB service object
const dynamodb = new AWS.DynamoDB();

// Table parameters
const params = {
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
  // TimeToLiveSpecification is removed, will be set after table creation
};

// Create table
dynamodb.createTable(params, (err, data) => {
  if (err) {
    console.error('Unable to create table. Error:', JSON.stringify(err, null, 2));
  } else {
    console.log('Created table:', JSON.stringify(data, null, 2));
    
    // Wait for table to become active before setting TTL
    console.log('Waiting for table to become active...');
    dynamodb.waitFor('tableExists', {TableName: 'trofai-image-status'}, function(err, data) {
      if (err) {
        console.error('Error waiting for table to become active:', err);
      } else {
        console.log('Table is now active. Setting TTL...');
        
        // Enable TTL after table creation
        dynamodb.updateTimeToLive({
          TableName: 'trofai-image-status',
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: 'ttl'
          }
        }, (err, data) => {
          if (err) {
            console.error('Unable to enable TTL. Error:', JSON.stringify(err, null, 2));
          } else {
            console.log('TTL enabled:', JSON.stringify(data, null, 2));
          }
        });
      }
    });
  }
}); 