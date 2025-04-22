require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

console.log('Google API Key available:', !!process.env.GOOGLE_API_KEY);
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

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Updated model

// Function to generate captions
async function generateCaptions(propertyData) {
  console.log('Generating captions with Google Gemini...');
  
  try {
    // Format the prompt for Gemini
    const prompt = `You are an expert real estate copywriter tasked with creating two distinct social media post options for the following property. Your goal is to generate engaging posts that attract serious buyers.

Your tone should be:
- Professional, knowledgeable, and enthusiastic.
- Focused on highlighting the unique value proposition and lifestyle appeal.
- Evocative, painting a picture of living in the property and neighborhood.

Property Details:
- Location: ${propertyData.location_name}
- Bedrooms: ${propertyData.bedroom}
- Bathrooms: ${propertyData.bathrooms}
- Price: ${propertyData.price}
- Key Features: ${propertyData.key_features}
- Description: ${propertyData.listing_description}

Requirements for EACH caption:
1.  Write from the perspective of a listing agent (first person).
2.  Start with a strong, attention-grabbing hook specific to the property.
3.  Weave together the Description and Key Features into a compelling narrative, explaining benefits.
4.  Based on the Location (${propertyData.location_name}), briefly mention specific nearby amenities, landmarks, or the neighborhood vibe.
5.  Maintain a sophisticated and aspirational tone.
6.  Use only 2-4 relevant emojis sparingly.
7.  Include 3-5 relevant and specific hashtags (e.g., #LuxuryCanaryWharf, #LondonE14Living).
8.  End with a clear, professional call-to-action inviting contact (e.g., "Contact me today for details!"). You don't need to include specific email/phone here, as this is a general test script.
9.  Ensure good structure and readability (short paragraphs).
10. Strictly NO ASTERISKS or markdown formatting. Plain text only.
11. Make sure the two captions are distinct in their angle, focus, or opening hook.

Please format your response clearly labeling the two options as "CAPTION 1:" and "CAPTION 2:".`;

    // Call Google Gemini API
    console.log('Sending request to Google Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log('Received response from Google Gemini');
    
    // Extract and process the generated captions
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
    console.error('Error generating caption with Google Gemini:', error);
    // Add more specific error handling if desired
    if (error.message && error.message.includes('API key not valid')) {
        console.error("Check your GOOGLE_API_KEY in the .env file.");
    }
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