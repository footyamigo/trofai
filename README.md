# Trofai - Real Estate Content Generator

A powerful application for generating professional property listings, designs, and social media captions for real estate agents.

## Features

- **Property Data Scraping:** Automatically extract property details from listing URLs
- **Image Generation:** Create professional property marketing images
- **Caption Generation:** Generate engaging captions for social media posts
- **User Authentication:** Secure user authentication and authorization
- **Property Management:** Save and manage your property listings
- **Design Storage:** Store and access your generated designs

## Technology Stack

- **Frontend:** Next.js, React
- **Backend:** Node.js, Next.js API routes
- **Authentication:** AWS Cognito
- **Database:** AWS DynamoDB
- **Storage:** AWS S3
- **Infrastructure:** AWS CloudFormation

## Prerequisites

- Node.js 16+
- AWS Account
- AWS CLI installed and configured

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/trofai.git
cd trofai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up AWS infrastructure

#### Option 1: Using AWS CloudFormation Console

1. Log in to the AWS Management Console
2. Navigate to CloudFormation
3. Click "Create stack" > "With new resources"
4. Upload the `aws-infrastructure.yml` file
5. Fill in the parameters:
   - Environment: dev (or staging/prod)
   - AppName: trofai
   - AdminEmail: your-email@example.com
   - S3BucketName: a globally unique bucket name (e.g., trofai-assets-yourname)
6. Follow the prompts to create the stack
7. Wait for the stack creation to complete

#### Option 2: Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name trofai-infrastructure \
  --template-body file://aws-infrastructure.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=AppName,ParameterValue=trofai \
    ParameterKey=AdminEmail,ParameterValue=your-email@example.com \
    ParameterKey=S3BucketName,ParameterValue=trofai-assets-yourname \
  --capabilities CAPABILITY_IAM
```

### 4. Configure environment variables

Create a `.env.local` file in the root directory with the following variables:

```
# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1  # Or your chosen region
NEXT_PUBLIC_USER_POOL_ID=<your-cognito-user-pool-id>
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=<your-cognito-client-id>
NEXT_PUBLIC_S3_BUCKET=<your-s3-bucket-name>
NEXT_PUBLIC_API_ENDPOINT=<your-api-gateway-endpoint>

# AWS Credentials (Only needed for server-side operations)
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>

# DynamoDB Tables
DYNAMODB_USERS_TABLE=trofai-users-dev
DYNAMODB_PROPERTIES_TABLE=trofai-properties-dev
DYNAMODB_DESIGNS_TABLE=trofai-designs-dev
DYNAMODB_CAPTIONS_TABLE=trofai-captions-dev

# Other API Keys
OPENAI_API_KEY=<your-openai-api-key>
ROBORABBIT_API_KEY=<your-roborabbit-api-key>
TASK_UID=<your-task-uid>
BANNERBEAR_API_KEY=<your-bannerbear-api-key>
BANNERBEAR_TEMPLATE_UID=<your-bannerbear-template-uid>
BANNERBEAR_TEMPLATE_SET_UID=<your-bannerbear-template-set-uid>
```

You can get the Cognito User Pool ID and Client ID from the AWS CloudFormation outputs.

### 5. Run the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 6. Setting up a user account

After setting up the infrastructure, you'll need to:

1. Visit the application at http://localhost:3000
2. Click "Sign Up" to create a new account
3. Verify your email with the verification code sent to your inbox
4. Sign in with your credentials

## Deployment

### Deploy to AWS Amplify

1. Create a new Amplify app in the AWS Management Console
2. Connect to your repository
3. Configure the build settings
4. Add the environment variables from your `.env.local` file
5. Deploy the application

## Project Structure

- `/components` - React components
- `/pages` - Next.js pages and API routes
- `/public` - Static files
- `/src` - Source code
  - `/aws` - AWS integrations
  - `/context` - React Context providers
  - `/hooks` - Custom React hooks
  - `/utils` - Utility functions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenAI for the GPT models
- AWS for the cloud infrastructure
- Next.js and React for the frontend framework 