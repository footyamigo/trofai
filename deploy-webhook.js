const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS with credentials from .env file
AWS.config.update({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIA5WUI3VMW4XKJCJOU',
    secretAccessKey: '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'
  }
});

const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const iam = new AWS.IAM();

// Read the ZIP file
const zipFilePath = path.join(__dirname, 'webhook-lambda.zip');
const zipFile = fs.readFileSync(zipFilePath);

async function createRole() {
  console.log('Creating IAM role...');
  
  const roleName = 'trofai-webhook-lambda-role';
  
  // Trust policy for Lambda
  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: {
        Service: 'lambda.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }]
  };
  
  try {
    // Create the role
    const createRoleResponse = await iam.createRole({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
      Description: 'Role for Trofai webhook Lambda function'
    }).promise();
    
    console.log('IAM role created:', createRoleResponse.Role.Arn);
    
    // Attach the DynamoDB policy
    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess'
    }).promise();
    
    console.log('DynamoDB policy attached');
    
    // Attach basic Lambda execution policy
    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
    }).promise();
    
    console.log('Lambda execution policy attached');
    
    // Wait for a few seconds for the role to propagate
    console.log('Waiting for role to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return createRoleResponse.Role.Arn;
  } catch (error) {
    // If the role already exists, get its ARN
    if (error.code === 'EntityAlreadyExists') {
      console.log('Role already exists, retrieving ARN...');
      const getResponse = await iam.getRole({ RoleName: roleName }).promise();
      return getResponse.Role.Arn;
    }
    throw error;
  }
}

async function createLambdaFunction(roleArn) {
  console.log('Creating Lambda function...');
  
  const functionName = 'trofai-webhook-handler';
  
  try {
    // Check if the function already exists
    try {
      await lambda.getFunction({ FunctionName: functionName }).promise();
      
      // If we got here, the function exists - update it
      console.log('Function exists, updating code...');
      
      const updateResponse = await lambda.updateFunctionCode({
        FunctionName: functionName,
        ZipFile: zipFile
      }).promise();
      
      console.log('Lambda function code updated:', updateResponse.FunctionArn);
      
      // Update configuration including environment variables
      const configResponse = await lambda.updateFunctionConfiguration({
        FunctionName: functionName,
        Environment: {
          Variables: {
            ACCESS_KEY_ID: 'AKIA5WUI3VMW4XKJCJOU',
            SECRET_ACCESS_KEY: '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',
            REGION: 'us-east-1',
            BANNERBEAR_WEBHOOK_SECRET: 'bb_wh_b8925dda9f9bcdd3988515e8a85d69'
          }
        }
      }).promise();
      
      console.log('Lambda function configuration updated');
      
      return updateResponse.FunctionArn;
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
      
      // Function doesn't exist, create it
      const createResponse = await lambda.createFunction({
        FunctionName: functionName,
        Runtime: 'nodejs18.x',
        Role: roleArn,
        Handler: 'index.handler',
        Code: {
          ZipFile: zipFile
        },
        Description: 'Trofai webhook handler for Bannerbear',
        Timeout: 30,
        MemorySize: 128,
        Environment: {
          Variables: {
            ACCESS_KEY_ID: 'AKIA5WUI3VMW4XKJCJOU',
            SECRET_ACCESS_KEY: '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',
            REGION: 'us-east-1',
            BANNERBEAR_WEBHOOK_SECRET: 'bb_wh_b8925dda9f9bcdd3988515e8a85d69'
          }
        }
      }).promise();
      
      console.log('Lambda function created:', createResponse.FunctionArn);
      return createResponse.FunctionArn;
    }
  } catch (error) {
    console.error('Error creating/updating Lambda function:', error);
    throw error;
  }
}

async function createApiGateway(lambdaArn) {
  console.log('Creating API Gateway...');
  
  try {
    // Create API
    const apiName = 'trofai-webhook-api';
    
    // Check if API already exists
    let apiId;
    try {
      const apis = await apigateway.getRestApis().promise();
      const existingApi = apis.items.find(api => api.name === apiName);
      
      if (existingApi) {
        apiId = existingApi.id;
        console.log('API already exists:', apiId);
      } else {
        // Create new API
        const apiResponse = await apigateway.createRestApi({
          name: apiName,
          description: 'API for Trofai webhook handler',
          endpointConfiguration: {
            types: ['REGIONAL']
          }
        }).promise();
        
        apiId = apiResponse.id;
        console.log('API created:', apiId);
      }
      
      // Get resources
      const resourcesResponse = await apigateway.getResources({
        restApiId: apiId
      }).promise();
      
      // Find root resource
      const rootResource = resourcesResponse.items.find(r => r.path === '/');
      
      // Check if /webhook resource exists
      let webhookResource = resourcesResponse.items.find(r => r.path === '/webhook');
      
      if (!webhookResource) {
        // Create /webhook resource
        const createResourceResponse = await apigateway.createResource({
          restApiId: apiId,
          parentId: rootResource.id,
          pathPart: 'webhook'
        }).promise();
        
        webhookResource = createResourceResponse;
        console.log('Webhook resource created');
      }
      
      // Create or update GET method
      try {
        await apigateway.getMethod({
          restApiId: apiId,
          resourceId: webhookResource.id,
          httpMethod: 'GET'
        }).promise();
        
        console.log('GET method already exists');
      } catch (err) {
        if (err.code === 'NotFoundException') {
          await apigateway.putMethod({
            restApiId: apiId,
            resourceId: webhookResource.id,
            httpMethod: 'GET',
            authorizationType: 'NONE'
          }).promise();
          
          console.log('GET method created');
        } else {
          throw err;
        }
      }
      
      // Create or update PUT method
      try {
        await apigateway.getMethod({
          restApiId: apiId,
          resourceId: webhookResource.id,
          httpMethod: 'POST'
        }).promise();
        
        console.log('POST method already exists');
      } catch (err) {
        if (err.code === 'NotFoundException') {
          await apigateway.putMethod({
            restApiId: apiId,
            resourceId: webhookResource.id,
            httpMethod: 'POST',
            authorizationType: 'NONE'
          }).promise();
          
          console.log('POST method created');
        } else {
          throw err;
        }
      }
      
      // Set up Lambda integration for GET
      await apigateway.putIntegration({
        restApiId: apiId,
        resourceId: webhookResource.id,
        httpMethod: 'GET',
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
      }).promise();
      
      console.log('GET method integration set up');
      
      // Set up Lambda integration for POST
      await apigateway.putIntegration({
        restApiId: apiId,
        resourceId: webhookResource.id,
        httpMethod: 'POST',
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`
      }).promise();
      
      console.log('POST method integration set up');
      
      // Add Lambda permissions
      try {
        await lambda.addPermission({
          FunctionName: 'trofai-webhook-handler',
          StatementId: `apigateway-get-${Date.now()}`,
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:us-east-1:*:${apiId}/*/GET/webhook`
        }).promise();
        
        console.log('GET method permission added');
      } catch (error) {
        console.warn('Warning adding GET permission (may already exist):', error.message);
      }
      
      try {
        await lambda.addPermission({
          FunctionName: 'trofai-webhook-handler',
          StatementId: `apigateway-post-${Date.now()}`,
          Action: 'lambda:InvokeFunction',
          Principal: 'apigateway.amazonaws.com',
          SourceArn: `arn:aws:execute-api:us-east-1:*:${apiId}/*/POST/webhook`
        }).promise();
        
        console.log('POST method permission added');
      } catch (error) {
        console.warn('Warning adding POST permission (may already exist):', error.message);
      }
      
      // Deploy API
      const deploymentResponse = await apigateway.createDeployment({
        restApiId: apiId,
        stageName: 'prod',
        description: 'Production deployment'
      }).promise();
      
      console.log('API deployed:', deploymentResponse.id);
      
      // Build and return the invoke URL
      const invokeUrl = `https://${apiId}.execute-api.us-east-1.amazonaws.com/prod/webhook`;
      return invokeUrl;
    } catch (error) {
      console.error('Error creating API Gateway:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createApiGateway:', error);
    throw error;
  }
}

async function createDynamoDBTable() {
  console.log('Creating DynamoDB table...');
  
  const dynamodb = new AWS.DynamoDB();
  
  try {
    // Check if table exists
    try {
      await dynamodb.describeTable({
        TableName: 'trofai-image-status'
      }).promise();
      
      console.log('Table already exists');
      return true;
    } catch (err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
      
      // Create table
      await dynamodb.createTable({
        TableName: 'trofai-image-status',
        AttributeDefinitions: [
          {
            AttributeName: 'uid',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'uid',
            KeyType: 'HASH'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      }).promise();
      
      console.log('DynamoDB table created successfully');
      
      // Wait for table to become active
      console.log('Waiting for table to become active...');
      
      let tableActive = false;
      while (!tableActive) {
        const checkResponse = await dynamodb.describeTable({
          TableName: 'trofai-image-status'
        }).promise();
        
        if (checkResponse.Table.TableStatus === 'ACTIVE') {
          tableActive = true;
          console.log('Table is now active');
        } else {
          console.log('Table status:', checkResponse.Table.TableStatus);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error creating DynamoDB table:', error);
    throw error;
  }
}

async function main() {
  try {
    // Create DynamoDB table
    await createDynamoDBTable();
    
    // Create IAM role
    const roleArn = await createRole();
    console.log('Role ARN:', roleArn);
    
    // Create Lambda function
    const lambdaArn = await createLambdaFunction(roleArn);
    console.log('Lambda ARN:', lambdaArn);
    
    // Create API Gateway
    const invokeUrl = await createApiGateway(lambdaArn);
    console.log('API Gateway invoke URL:', invokeUrl);
    console.log('\nSetup complete!');
    console.log('\nUpdate your Bannerbear webhook URL to:', invokeUrl);
  } catch (error) {
    console.error('Error in setup:', error);
  }
}

main(); 