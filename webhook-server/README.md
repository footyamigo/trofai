# Trofai Webhook Server

A webhook server for Bannerbear integration that receives webhook notifications and stores them in DynamoDB.

## Local Development

1. Install dependencies:
```
npm install
```

2. Create a DynamoDB table:
```
node setup-dynamodb.js
```
Note: Make sure you have AWS credentials set up before running this script.

3. Set AWS credentials as environment variables:
```
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_REGION=us-east-1
```

4. Start the server:
```
npm start
```

5. Test the webhook server:
```
node test-webhook.js
```

The server will run on port 3001 by default.

## Deployment to AWS Elastic Beanstalk

### Prerequisites
1. Install the AWS EB CLI:
```
pip install awsebcli
```

2. Install AWS CLI:
```
pip install awscli
```

3. Configure AWS credentials:
```
aws configure
```

### Deployment Steps

1. Initialize the EB project (if not already done):
```
cd webhook-server
eb init
```
When prompted:
- Select the region (same as where your DynamoDB will be)
- Create a new application or use existing one
- Select Node.js platform
- Set up SSH for instance access (optional)

2. Create the DynamoDB table (if not already created):
```
node setup-dynamodb.js
```

3. Create the Elastic Beanstalk environment and deploy:
```
eb create trofai-webhook-server --single
```
Using the `--single` flag creates a single-instance environment without a load balancer, which is more cost-effective for this use case.

4. Set environment variables:
```
eb setenv AWS_ACCESS_KEY_ID=your_access_key AWS_SECRET_ACCESS_KEY=your_secret_key AWS_REGION=us-east-1
```

5. Open the deployed application:
```
eb open
```

6. For subsequent deployments:
```
eb deploy
```

7. To monitor the application logs:
```
eb logs
```

### Setting Up the Webhook URL in Bannerbear

Once deployed, your webhook URL will be:
`http://your-eb-environment-url.elasticbeanstalk.com/webhook`

Use this URL in Bannerbear's webhook configuration.

## API Endpoints

- `GET /` - Health check
- `GET /webhook` - Webhook verification endpoint (responds with 200 OK)
- `POST /webhook` - Webhook data endpoint (processes incoming data)
- `GET /status/:uid` - Get status for a specific UID 