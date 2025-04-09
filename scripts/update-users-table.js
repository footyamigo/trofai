const AWS = require('aws-sdk');

// Configure AWS with hardcoded credentials (these are the same ones used in your other scripts)
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIA5WUI3VMW4XKJCJOU',
    secretAccessKey: 'WINVcsamXIxLaJlxKdq/ROPGVEav0PKG+07cX8jv'
  }
});

const dynamodb = new AWS.DynamoDB();

async function updateUsersTable() {
  try {
    console.log('Updating users table with session index...');

    // First, add the session attribute to the attribute definitions
    const updateParams = {
      TableName: 'trofai-users',
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'username', AttributeType: 'S' },
        { AttributeName: 'session', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'SessionIndex',
            KeySchema: [
              { AttributeName: 'session', KeyType: 'HASH' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        }
      ]
    };

    const result = await dynamodb.updateTable(updateParams).promise();
    console.log('Update initiated:', result);
    console.log('Waiting for index to be created (this may take a few minutes)...');

    // Wait for the index to be active
    let indexStatus = 'CREATING';
    while (indexStatus === 'CREATING') {
      const table = await dynamodb.describeTable({ TableName: 'trofai-users' }).promise();
      const sessionIndex = table.Table.GlobalSecondaryIndexes?.find(idx => idx.IndexName === 'SessionIndex');
      
      if (sessionIndex) {
        indexStatus = sessionIndex.IndexStatus;
        console.log('Current index status:', indexStatus);
        
        if (indexStatus === 'ACTIVE') {
          console.log('SessionIndex is now active!');
          break;
        }
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } catch (error) {
    if (error.code === 'ValidationException' && error.message.includes('Index SessionIndex already exists')) {
      console.log('SessionIndex already exists on the table');
    } else {
      console.error('Error updating table:', error);
      throw error;
    }
  }
}

// Run the update
updateUsersTable().catch(console.error); 