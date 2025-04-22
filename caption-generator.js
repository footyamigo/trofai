const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro"}); // Updated model

const CAPTION_TYPES = {
    INSTAGRAM: 'instagram',
    FACEBOOK: 'facebook',
    LINKEDIN: 'linkedin'
};

const CAPTION_LENGTHS = {
    [CAPTION_TYPES.INSTAGRAM]: 2200,  // Instagram max
    [CAPTION_TYPES.FACEBOOK]: 2000,   // Facebook optimal
    [CAPTION_TYPES.LINKEDIN]: 3000    // LinkedIn optimal
};

async function generatePropertyCaptions(propertyData, type = CAPTION_TYPES.INSTAGRAM, agentProfile = null) {
    try {
        // Always use agent-focused prompts
        const agentName = agentProfile?.name || "Your Name"; // Use placeholder if not available
        const agentEmail = agentProfile?.email || "your.email@example.com";
        const agentPhone = agentProfile?.phone || "Your Phone Number";

        console.log(`Generating caption in AGENT mode (defaulted) for: ${agentName}`);
        
        // Combine system and user prompt for Gemini
        const fullPrompt = `You are ${agentName}, an expert real estate copywriter known for crafting compelling and sophisticated property narratives for social media. Your goal is to generate an engaging post that attracts serious buyers for YOUR new listing.

Your tone should be:
- Professional, knowledgeable, and enthusiastic.
- Focused on highlighting the unique value proposition and lifestyle appeal.
- Evocative, painting a picture of living in the property and neighborhood.

Property Details:
- Location: ${propertyData.property.address}
- Price: ${propertyData.property.price}
- Layout: ${propertyData.property.bedrooms} bedrooms, ${propertyData.property.bathrooms} bathrooms
- Key Features: ${propertyData.property.keyFeatures}
- Additional Information/Facts: ${propertyData.property.facts || 'Not specified'}
- Property Story/Description: ${propertyData.property.description}

Your Contact Info:
- Name: ${agentName}
- Email: ${agentEmail}
- Phone: ${agentPhone}

Draft a detailed and captivating social media post about YOUR new listing, writing in the first person (as ${agentName}).

Requirements:
- Start with a strong, attention-grabbing hook about this specific property.
- Weave together the Property Story/Description, Key Features, and Additional Information/Facts into a compelling narrative. Don't just list features; explain their benefits and contribution to the lifestyle.
- Based on the property's location (${propertyData.property.address}), briefly mention specific nearby amenities, landmarks, transport links, or the general lifestyle appeal of the neighborhood to add local context.
- Maintain a sophisticated and aspirational tone throughout.
- Use 2-4 relevant emojis sparingly to enhance readability, not clutter the text.
- Include 3-5 relevant and specific hashtags (e.g., #LuxuryChelseaLiving, #CanaryWharfView, #Zone1Apartment).
- End with a clear and professional call-to-action inviting interested buyers to contact YOU directly. Format it like this: 'Contact me for details: 📧 ${agentEmail} 📞 ${agentPhone}'. Do not include your name in the CTA.
- Ensure the final caption is well-structured and easy to read, potentially using short paragraphs.
- Maximum length: ${CAPTION_LENGTHS[type]} characters.
- Strictly NO ASTERISKS or other markdown/special formatting. Plain text only.`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Remove any asterisks or markdown formatting from the generated caption
        return text.trim().replace(/\*/g, '');
    } catch (error) {
        console.error('Error generating caption with Google Gemini:', error);
        // Consider more specific error handling if needed
        if (error.message.includes('API key not valid')) {
             console.error("Check your GOOGLE_API_KEY in the .env file.");
        }
        return null; // Return null or throw error as appropriate
    }
}

// Export the function and constants
module.exports = {
    generatePropertyCaptions,
    CAPTION_TYPES
}; 