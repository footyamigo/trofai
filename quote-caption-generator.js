const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Ensure API key is loaded
if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Consider if gemini-1.5-pro is needed, or if flash is sufficient for captions.
// Using pro for consistency with testimonial captions for now.
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); 

async function generateQuoteCaption(quote, author, agentProfile = null, isRegeneration = false, currentCaption = null) {
    try {
        // Use provided agent details or fallbacks
        const agentName = agentProfile?.agent_name || "I";
        const agentEmail = agentProfile?.agent_email || "your.email@example.com";
        const agentPhone = agentProfile?.agent_number || "your phone number";
        // Add title or other details if needed
        // const agentTitle = agentProfile?.real_estate_agent || "Real Estate Agent"; 

        // Construct the prompt for quote captions
        let basePrompt = `You are a real estate agent (${agentName}) crafting a social media post based on an insightful quote.

Quote: "${quote}"
Author: ${author}

Your Goal: Share this quote to provide value, spark thought, and subtly connect it to the real estate journey, positioning yourself as a knowledgeable professional.

Instructions:
1. Write the post in the first person (using "I", "my", etc.).
2. Start with an engaging hook, perhaps introducing the quote or its theme (e.g., "This quote from ${author} really resonates...", "Thinking about the journey of buying/selling a home, this quote by ${author} comes to mind:").
3. Include the full quote clearly, attributed to the author: "${quote}" - ${author}
4. Briefly (1-2 sentences) reflect on the quote's meaning and how it applies to real estate, homeownership, or the client experience. Connect it to your services or philosophy.
5. Include a professional call-to-action inviting prospective clients to discuss their real estate goals. Format this EXACTLY, including emojis, on its own line: 'Ready to start your journey? Contact me: 📧 ${agentEmail} 📞 ${agentPhone}'.
6. Keep the tone inspiring, thoughtful, and professional.
7. Include 3-4 relevant real estate hashtags (e.g., #RealEstateQuotes, #HomeBuying, #InvestmentProperty, #RealEstateTips, #${agentName.replace(/\s+/g, '')}Realty).
8. Ensure the caption is concise and suitable for platforms like Instagram or Facebook.
9. Strictly NO ASTERISKS or other markdown/special formatting. Plain text only.`;

        let fullPrompt = basePrompt;
        if (isRegeneration) {
            let regenInstruction = `\n\n--- REGENERATION REQUEST ---
Please completely rewrite the social media post based on the quote and instructions above. Aim for a significantly different structure and phrasing, while still conveying the core message and reflecting on the quote's relevance.`;
            if (currentCaption) {
                regenInstruction += `\n\nAVOID simply repeating this previous version:\n"${currentCaption}"`;
            }
            fullPrompt += regenInstruction;
            console.log("Generating quote caption (Regeneration requested with context)...");
        } else {
             console.log("Generating initial quote caption...");
        }

        console.log("Sending prompt to Gemini for quote caption:", fullPrompt); 
       
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up potential markdown
        return text.trim().replace(/[*_]/g, ''); 

    } catch (error) {
        console.error('Error generating quote caption:', error);
        if (error.message.includes('API key not valid')) { console.error("Check your GOOGLE_API_KEY in the .env file."); }
        return null; // Return null on error
    }
}

module.exports = { generateQuoteCaption }; 