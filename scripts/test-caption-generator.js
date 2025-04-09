require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI Model configured:', process.env.OPENAI_MODEL);

// Sample property data for testing - similar to what would be scraped from RoboRabbit
const samplePropertyData = {
  location_name: "Newfoundland Place, London, E14",
  bedroom: "3",
  bathrooms: "3",
  price: "£8,519 pcm",
  key_features: "State-of-the-art gymnasium, resident lounge, sun-kissed west-facing terrace",
  listing_description: "This stunning 3-bedroom, 3-bathroom apartment offers a luxurious lifestyle with exclusive amenities including a state-of-the-art gymnasium, resident lounge, and a sun-kissed west-facing terrace. Enjoy seamless connectivity with Canary Wharf Underground, DLR, and the Elizabeth Line just moments away. Elevate your living experience with FIIT membership and indulge in curated social events designed for every taste.",
  estate_agent_name: "Vertus Homes"
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to generate captions
async function generateCaptions(propertyData) {
  console.log('Generating captions with OpenAI...');
  
  try {
    // Format the prompt for OpenAI
    const prompt = `Create two different Instagram captions for a real estate property listing with the following details:

Location: ${propertyData.location_name}
Bedrooms: ${propertyData.bedroom}
Bathrooms: ${propertyData.bathrooms}
Price: ${propertyData.price}
Key Features: ${propertyData.key_features}
Description: ${propertyData.listing_description}

Each caption should be:
1. Professional and compelling to attract potential buyers/renters
2. Include just 2-3 relevant emojis (not excessive)
3. Highlight key selling points of the property
4. Include a clear call to action
5. End with 3-4 relevant hashtags 
6. Be optimized for Instagram, around 100-150 words
7. Have a luxurious, sophisticated tone
8. Be formatted with proper spacing and line breaks
9. DO NOT include any asterisks (***) or similar markers at the beginning or end of the caption

Please format your response as two distinct captions labeled "CAPTION 1:" and "CAPTION 2:"`;

    console.log('Using model:', process.env.OPENAI_MODEL);
    
    // Call OpenAI API
    console.log('Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are a professional real estate marketer who writes compelling property listings that generate leads. Your captions are clean and professional without any asterisks or markers." 
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });
    
    console.log('Received response from OpenAI');
    
    // Extract and process the generated captions
    const generatedText = response.choices[0]?.message?.content.trim();
    console.log('Raw generated text length:', generatedText?.length || 0);
    console.log('First 50 characters:', generatedText?.substring(0, 50));
    
    // Extract the two captions
    let captionOptions = {
      main: "",
      alternative: ""
    };
    
    if (generatedText) {
      console.log('Splitting by CAPTION markers...');
      const parts = generatedText.split(/CAPTION [12]:/i);
      console.log('Split parts:', parts.length);
      
      if (parts.length >= 3) {
        captionOptions.main = parts[1].trim();
        captionOptions.alternative = parts[2].trim();
        
        console.log('Found two distinct captions');
        
        // Remove any asterisks or markers
        captionOptions.main = captionOptions.main.replace(/^\*+|\*+$/g, '').trim();
        captionOptions.alternative = captionOptions.alternative.replace(/^\*+|\*+$/g, '').trim();
      } else {
        console.log('Did not find proper caption splits, using entire text');
        captionOptions.main = generatedText.replace(/^\*+|\*+$/g, '').trim();
        captionOptions.alternative = "Alternative caption not provided by AI";
      }
      
      // Final check to ensure no artifacts
      Object.keys(captionOptions).forEach(key => {
        // Remove any remaining artifacts like '---' or '***'
        const before = captionOptions[key];
        captionOptions[key] = captionOptions[key].replace(/^[-*]+|[-*]+$/g, '').trim();
        if (before !== captionOptions[key]) {
          console.log(`Cleaned artifacts from ${key} caption`);
        }
      });
    }
    
    return captionOptions;
    
  } catch (error) {
    console.error('Error generating caption with OpenAI:', error);
    return { 
      main: "Failed to generate caption", 
      alternative: "Failed to generate alternative caption" 
    };
  }
}

// Load property data from JSON file if provided
function loadPropertyData(filePath) {
  try {
    if (!filePath) return null;
    
    const fullPath = path.resolve(filePath);
    console.log(`Loading property data from ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`Successfully loaded data from ${fullPath}`);
    return data;
  } catch (error) {
    console.error('Error loading property data:', error);
    return null;
  }
}

// Save generated captions to file
function saveCaptions(captions, outputFile) {
  try {
    if (!outputFile) return;
    
    const fullPath = path.resolve(outputFile);
    console.log(`Saving captions to ${fullPath}`);
    
    fs.writeFileSync(fullPath, JSON.stringify(captions, null, 2), 'utf8');
    console.log(`Successfully saved captions to ${fullPath}`);
  } catch (error) {
    console.error('Error saving captions:', error);
  }
}

// Run the test
async function runTest(inputFile, outputFile) {
  console.log('Starting caption generation test...');
  
  // Use file data if provided, otherwise use sample data
  const propertyData = inputFile ? loadPropertyData(inputFile) : samplePropertyData;
  
  if (!propertyData) {
    console.error('No valid property data found. Using sample data.');
    propertyData = samplePropertyData;
  }
  
  console.log('Property data to use:', JSON.stringify(propertyData, null, 2));
  
  try {
    console.log('Calling generateCaptions function...');
    const captions = await generateCaptions(propertyData);
    
    console.log('\n==== CAPTION OPTION 1 ====\n');
    console.log(captions.main);
    
    console.log('\n==== CAPTION OPTION 2 ====\n');
    console.log(captions.alternative);
    
    // Save captions to file if requested
    if (outputFile) {
      saveCaptions(captions, outputFile);
    }
    
    return captions;
  } catch (err) {
    console.error('Test failed:', err);
  }
}

// Process command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  let inputFile = null;
  let outputFile = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      inputFile = args[i + 1];
      i++; // Skip the next argument as it's the file path
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputFile = args[i + 1];
      i++; // Skip the next argument as it's the file path
    }
  }
  
  return { inputFile, outputFile };
}

// Execute the test
console.log('Script started');
const { inputFile, outputFile } = parseArguments();
runTest(inputFile, outputFile).then(() => console.log('Test completed')); 