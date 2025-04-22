import { GoogleGenerativeAI } from "@google/generative-ai";
import { formidable } from 'formidable';
import fs from 'fs';

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Google Generative AI
if (!process.env.GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY environment variable is not set.");
  // Consider throwing an error or handling this case appropriately
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to convert file buffer to generative part
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const imageFile = files.image?.[0]; // formidable wraps files in arrays

    if (!imageFile) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Read the file buffer
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const imageMimeType = imageFile.mimetype;

    // Prepare the prompt for Gemini
    const prompt = `Analyze the attached image, which is a screenshot of a customer review. Extract the following information and provide it ONLY as a JSON object with the keys "reviewerName" and "reviewText". 

- reviewerName: The name of the person who wrote the review. If the name is not clearly visible, return null.
- reviewText: The full text content of the review itself. Clean up any unnecessary text around the review if possible. If no review text is found, return null.

Example response: {"reviewerName": "Jane Doe", "reviewText": "This was a great experience!"}

Do not include any other text or explanations outside the JSON object.`;
    
    const imagePart = fileToGenerativePart(imageBuffer, imageMimeType);

    // Call the Gemini API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Attempt to parse the JSON response from Gemini
    let extractedData = null;
    let parseError = null;
    try {
      // --- Updated Cleaning Logic --- 
      let cleanedText = text.trim(); // Initial trim
      if (cleanedText.startsWith("```json")) {
          // Remove ```json and potential newline
          cleanedText = cleanedText.substring(cleanedText.indexOf('{')); 
      }
      if (cleanedText.endsWith("```")) {
          // Remove ``` from the end
          cleanedText = cleanedText.substring(0, cleanedText.lastIndexOf('}') + 1);
      }
      cleanedText = cleanedText.trim(); // Final trim
      // --- End Updated Cleaning Logic --- 

      extractedData = JSON.parse(cleanedText);
      
      // Basic validation
      if (typeof extractedData.reviewerName === 'undefined' || typeof extractedData.reviewText === 'undefined') {
          throw new Error('Expected JSON structure not found in parsed data.');
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", e);
      console.error("Raw Gemini response text:", text); // Log the original text
      // Try to log the cleaned text if parsing failed after cleaning attempt
      if (typeof cleanedText !== 'undefined') {
          console.error("Cleaned text before parsing failed:", cleanedText);
      }
      parseError = `Failed to parse response from AI. Check server logs for details. Raw response snippet: ${text.substring(0, 100)}...`; // Provide less raw data to client
    }

    // Clean up the temporary file uploaded by formidable
    fs.unlinkSync(imageFile.filepath);

    if (parseError) {
        return res.status(500).json({ success: false, message: parseError });
    }

    return res.status(200).json({ success: true, data: extractedData });

  } catch (error) {
    console.error("Error in /api/extract-review:", error);
    // Clean up temp file in case of error during processing
    // Note: This relies on imageFile being defined, might need more robust cleanup
    if (typeof imageFile !== 'undefined' && imageFile?.filepath && fs.existsSync(imageFile.filepath)) {
        try { fs.unlinkSync(imageFile.filepath); } catch (unlinkErr) { console.error("Error cleaning up temp file:", unlinkErr); }
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
} 