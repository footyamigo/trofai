const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIA5WUI3VMW4XKJCJOU',
    secretAccessKey: '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'
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