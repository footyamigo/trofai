# Caption Generator Testing Script

This script allows you to test the generation of Instagram captions for property listings without using the BannerBear image generation service, which saves credits during development and testing.

## Features

- Generates two distinct caption options for property listings
- Removes any asterisks or unwanted markers from captions
- Supports loading property data from JSON files
- Can save the generated captions to an output file
- Works with the same OpenAI model configured in your .env file

## Requirements

- Node.js installed
- Valid OpenAI API key in .env file
- Configuration in .env file:
  ```
  OPENAI_API_KEY=your_openai_api_key
  OPENAI_MODEL=gpt-4o-mini
  ```

## Usage

### Basic Usage

To run with the default sample property data:

```bash
node scripts/test-caption-generator.js
```

### Using Input Files

To use data from a RoboRabbit scraped property JSON file:

```bash
node scripts/test-caption-generator.js --input path/to/property-data.json
```

or with the short flag:

```bash
node scripts/test-caption-generator.js -i path/to/property-data.json
```

### Saving Output

To save the generated captions to a file:

```bash
node scripts/test-caption-generator.js --output path/to/save-captions.json
```

or with the short flag:

```bash
node scripts/test-caption-generator.js -o path/to/save-captions.json
```

### Combined Options

You can combine input and output options:

```bash
node scripts/test-caption-generator.js -i path/to/property-data.json -o path/to/save-captions.json
```

## Input File Format

The input JSON file should have a format similar to:

```json
{
  "location_name": "Newfoundland Place, London, E14",
  "bedroom": "3",
  "bathrooms": "3",
  "price": "£8,519 pcm",
  "key_features": "State-of-the-art gymnasium, resident lounge, sun-kissed west-facing terrace",
  "listing_description": "This stunning 3-bedroom, 3-bathroom apartment offers a luxurious lifestyle...",
  "estate_agent_name": "Vertus Homes"
}
```

## Output Format

The output JSON file will contain two captions:

```json
{
  "main": "First caption text...",
  "alternative": "Second caption text..."
}
```

## Troubleshooting

If you encounter issues:

1. Check that your OpenAI API key is valid in the .env file
2. Ensure the OPENAI_MODEL in .env is set to a model your account has access to
3. Verify that your input JSON file has the correct format
4. Check for errors in the console output

## Implementation Details

The script specifically addresses issues with:
- Removing unwanted asterisks (***) at the beginning and end of captions
- Ensuring that two distinct caption options are always generated
- Proper formatting for Instagram with appropriate emojis and hashtags 