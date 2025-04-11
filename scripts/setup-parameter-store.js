const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from both .env and .env.local files
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configure AWS SDK
AWS.config.update({
    region: process.env.REGION || process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
});

const ssm = new AWS.SSM();

// List of parameters to store
const parameters = [
    // Firecrawl Configuration
    {
        name: 'FIRECRAWL_API_KEY',
        value: process.env.FIRECRAWL_API_KEY,
        type: 'SecureString'
    },
    // Bannerbear Configuration
    {
        name: 'BANNERBEAR_API_KEY',
        value: process.env.BANNERBEAR_API_KEY,
        type: 'SecureString'
    },
    {
        name: 'BANNERBEAR_TEMPLATE_UID',
        value: process.env.BANNERBEAR_TEMPLATE_UID,
        type: 'String'
    },
    {
        name: 'BANNERBEAR_WEBHOOK_SECRET',
        value: process.env.BANNERBEAR_WEBHOOK_SECRET,
        type: 'SecureString'
    },
    {
        name: 'BANNERBEAR_TEMPLATE_SET_UID',
        value: process.env.BANNERBEAR_TEMPLATE_SET_UID,
        type: 'String'
    },
    {
        name: 'BANNERBEAR_PROJECT_ID',
        value: process.env.BANNERBEAR_PROJECT_ID,
        type: 'String'
    },
    // AWS Configuration
    {
        name: 'ACCESS_KEY_ID',
        value: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
        type: 'SecureString'
    },
    {
        name: 'SECRET_ACCESS_KEY',
        value: process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
        type: 'SecureString'
    },
    // OpenAI Configuration
    {
        name: 'OPENAI_API_KEY',
        value: process.env.OPENAI_API_KEY,
        type: 'SecureString'
    },
    {
        name: 'OPENAI_MODEL',
        value: process.env.OPENAI_MODEL,
        type: 'String'
    },
    // Roborabbit Configuration
    {
        name: 'ROBORABBIT_API_KEY',
        value: process.env.ROBORABBIT_API_KEY,
        type: 'SecureString'
    },
    {
        name: 'TASK_UID',
        value: process.env.TASK_UID,
        type: 'String'
    },
    // DynamoDB Tables
    {
        name: 'DYNAMODB_USERS_TABLE',
        value: process.env.DYNAMODB_USERS_TABLE,
        type: 'String'
    },
    {
        name: 'DYNAMODB_PROPERTIES_TABLE',
        value: process.env.DYNAMODB_PROPERTIES_TABLE,
        type: 'String'
    },
    {
        name: 'DYNAMODB_DESIGNS_TABLE',
        value: process.env.DYNAMODB_DESIGNS_TABLE,
        type: 'String'
    },
    {
        name: 'DYNAMODB_CAPTIONS_TABLE',
        value: process.env.DYNAMODB_CAPTIONS_TABLE,
        type: 'String'
    },
    // Public Configuration (stored for completeness)
    {
        name: 'NEXT_PUBLIC_USER_POOL_ID',
        value: process.env.NEXT_PUBLIC_USER_POOL_ID,
        type: 'String'
    },
    {
        name: 'NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID',
        value: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
        type: 'String'
    },
    {
        name: 'NEXT_PUBLIC_S3_BUCKET',
        value: process.env.NEXT_PUBLIC_S3_BUCKET,
        type: 'String'
    }
];

async function setupParameters() {
    console.log('Setting up AWS Parameter Store values...');
    console.log('Using region:', AWS.config.region);
    
    for (const param of parameters) {
        if (!param.value) {
            console.warn(`Warning: ${param.name} is not set in environment variables`);
            continue;
        }

        try {
            await ssm.putParameter({
                Name: `/trofai/${process.env.NODE_ENV}/${param.name}`,
                Value: param.value,
                Type: param.type,
                Overwrite: true
            }).promise();

            console.log(`✅ Successfully stored ${param.name} in Parameter Store (${param.type})`);
        } catch (error) {
            console.error(`❌ Failed to store ${param.name}:`, error.message);
        }
    }
}

setupParameters().catch(console.error); 