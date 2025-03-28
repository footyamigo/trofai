# Trofai Property Image Generator

A Node.js application that generates social media images for property listings using Rightmove data and Bannerbear templates.

## Features

- Scrapes property data from Rightmove listings
- Generates Instagram-ready captions
- Creates custom property images using Bannerbear templates
- Supports both sales and rental properties
- Webhook integration for image generation status updates

## Prerequisites

- Node.js 18 or higher
- AWS Account (for DynamoDB)
- Bannerbear API Key
- Roborabbit API Key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
ROBORABBIT_API_KEY=your_roborabbit_key
TASK_UID=your_task_uid
BANNERBEAR_API_KEY=your_bannerbear_key
BANNERBEAR_TEMPLATE_UID=your_template_uid
BANNERBEAR_WEBHOOK_SECRET=your_webhook_secret
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/footyamigo/trofai.git
cd trofai
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AWS Setup

1. Create a DynamoDB table:
   - Table name: `trofai-image-status`
   - Partition key: `uid` (String)
   - Enable TTL on `ttl` attribute

2. Create an IAM user with DynamoDB permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/trofai-image-status"
        }
    ]
}
```

## Deployment

The project is configured for deployment with AWS Amplify. Follow these steps:

1. Push your code to GitHub
2. Create a new Amplify app
3. Connect your repository
4. Add environment variables in Amplify Console
5. Deploy

## License

MIT License - see LICENSE file for details

## Project Structure

- `test-rightmove.js` - Main script for testing property scraping and image generation
- `webhook-handler.js` - Express server for handling Bannerbear webhooks
- `caption-generator.js` - Generates social media captions for properties
- `.env` - Environment variables configuration
- `.gitignore` - Specifies which files Git should ignore

## Development

The project uses several key technologies:
- Node.js for the runtime environment
- Express for the webhook server
- Bannerbear API for image generation
- Roborabbit for web scraping

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Bannerbear for image generation
- Roborabbit for web scraping capabilities
- Rightmove for property data 