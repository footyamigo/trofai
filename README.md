# Trofai Property Image Generator

A Node.js application that generates social media images for property listings using Rightmove data and Bannerbear templates.

## Features

- Scrapes property data from Rightmove listings
- Generates Instagram-ready captions
- Creates custom property images using Bannerbear templates
- Supports both sales and rental properties
- Webhook integration for image generation status updates

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A Bannerbear account with API access
- A Roborabbit account with API access

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

3. Create a `.env` file in the root directory and add your API keys:
```env
ROBORABBIT_API_KEY=your_roborabbit_api_key
TASK_UID=your_task_uid
BANNERBEAR_API_KEY=your_bannerbear_api_key
BANNERBEAR_TEMPLATE_UID=your_template_uid
BANNERBEAR_WEBHOOK_URL=your_webhook_url
BANNERBEAR_WEBHOOK_SECRET=your_webhook_secret
```

## Usage

### Testing Property Image Generation

Run the test script with a Rightmove property URL:
```bash
node test-rightmove.js "https://www.rightmove.co.uk/properties/YOUR_PROPERTY_ID"
```

### Starting the Webhook Server

To receive image generation status updates:
```bash
node webhook-handler.js
```

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bannerbear for image generation
- Roborabbit for web scraping capabilities
- Rightmove for property data 