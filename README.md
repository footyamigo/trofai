# Rightmove Property Scraper

A robust property scraping solution for Rightmove listings using Firecrawl and Roborabbit APIs.

## Features

- Property data extraction from Rightmove listings
- Fallback mechanism between Firecrawl and Roborabbit APIs
- Image processing with Bannerbear
- Property description generation with OpenAI
- AWS S3 integration for asset storage

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd <repo-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your API keys and configuration values
   ```bash
   cp .env.example .env.local
   ```

4. Configure AWS credentials (if using S3 storage):
   - Set up AWS credentials in your environment
   - Update the S3 bucket name in your `.env.local`

## Development

Run the development server:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

Test individual scrapers:
```bash
node test-firecrawl.js <rightmove-url>
node test-roborabbit.js <rightmove-url>
```

## Environment Variables

Required environment variables are documented in `.env.example`. Make sure to set all required variables before running the application.

## Security

- Never commit `.env` files or any files containing API keys
- Keep your API keys and secrets secure
- Use environment variables for all sensitive information

## License

[Your chosen license] 