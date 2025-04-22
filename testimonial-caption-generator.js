const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Ensure API key is loaded (same check as property generator)
if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY environment variable is not set.");
    // Handle error appropriately in a real application
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use a capable model

async function generateTestimonialCaption(reviewerName, reviewText, agentProfile = null, isRegeneration = false, currentCaption = null) {
    try {
        const agentName = agentProfile?.name || "I"; 
        const agentEmail = agentProfile?.email || "your.email@example.com"; 
        const agentPhone = agentProfile?.phone || "your phone number";
        
        let basePrompt = `You are a real estate agent (${agentName}) crafting a social media post to share positive feedback you personally received from a client.

Client's Name: ${reviewerName || 'A valued client'}
Their Testimonial: "${reviewText}"

Your Goal: Authentically share this wonderful feedback to build trust and showcase your dedication to client satisfaction.

Instructions:
1. Write the post in the first person (using "I", "my", etc.) expressing your genuine appreciation for the client and their kind words. Refer to the experience described in the testimonial directly.
2. Start by thanking the client: "So grateful to ${reviewerName || 'my recent client'} for sharing their experience..." or similar.
3. Briefly highlight 1-2 key positive points from their testimonial that reflect *your* service (e.g., "I'm thrilled I could make the process seamless...", "Helping clients find the right property is always my goal..."). Avoid simply re-quoting long sentences.
4. Add a sentence expressing your commitment to providing excellent service to all clients.
5. Include a professional call-to-action inviting prospective clients to get in touch. Format this EXACTLY, including emojis, on its own line: 'Contact me for details: 📧 ${agentEmail} 📞 ${agentPhone}'.
6. Keep the tone thankful, professional, and client-focused.
7. Include 2-3 relevant real estate hashtags (e.g., #ClientLove, #RealEstateAgent, #TestimonialTuesday, #HappyClients).
8. Ensure the caption is concise and suitable for platforms like Instagram or Facebook.
9. Strictly NO ASTERISKS or other markdown/special formatting. Plain text only.`;

        let fullPrompt = basePrompt;
        if (isRegeneration) {
            let regenInstruction = `\n\n--- REGENERATION REQUEST ---
Please completely rewrite the social media post based on the testimonial and instructions above. Aim for a significantly different structure and phrasing, while still conveying the core message of gratitude and client satisfaction.`;
            if (currentCaption) {
                regenInstruction += `\n\nAVOID simply repeating this previous version:\n"${currentCaption}"`;
            }
            fullPrompt += regenInstruction;
            console.log("Generating testimonial caption (Strong Regeneration requested with context)...");
        } else {
             console.log("Generating initial testimonial caption...");
        }
       
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return text.trim().replace(/[*_]/g, ''); 

    } catch (error) {
        console.error('Error generating testimonial caption:', error);
        if (error.message.includes('API key not valid')) { console.error("Check your GOOGLE_API_KEY in the .env file."); }
        return null; 
    }
}

module.exports = { generateTestimonialCaption }; 