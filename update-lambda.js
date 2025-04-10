const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const lambda = new AWS.Lambda();

// Read the zip file
const zipFile = fs.readFileSync(path.join(__dirname, 'webhook-lambda.zip'));

async function updateLambda() {
  try {
    const result = await lambda.updateFunctionCode({
      FunctionName: 'trofai-webhook-handler',
      ZipFile: zipFile
    }).promise();
    
    console.log('Lambda function updated successfully:', result.FunctionName);
  } catch (error) {
    console.error('Error updating Lambda function:', error);
  }
}

updateLambda(); 