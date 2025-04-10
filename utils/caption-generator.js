const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

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

async function generatePropertyCaptions(propertyData, type = CAPTION_TYPES.INSTAGRAM) {
    try {
        const systemPrompt = `You are a highly experienced real estate copywriter who specializes in crafting sophisticated, emotionally resonant property descriptions. Your writing:

1. Creates an immediate emotional connection with the reader
2. Paints a vivid picture of the lifestyle the property offers
3. Weaves in property features naturally within a compelling narrative
4. Uses elegant, refined language that appeals to discerning buyers
5. Maintains warmth and authenticity while being professional
6. Tells a story about the home and its potential

Important: Write in plain text with emojis only. Do not use any asterisks (*), markdown formatting, or other special characters.

Style guidelines:
- Write with sophistication and emotional intelligence
- Focus on the experience of living in the property
- Use emojis thoughtfully to complement the narrative
- Include relevant hashtags elegantly
- Keep descriptions evocative yet concise
- Highlight unique character and potential`;

        const maxTokens = Math.floor(CAPTION_LENGTHS[type] * 1.5);

        const userPrompt = `Create a sophisticated and emotionally resonant property description that tells a compelling story. Write in plain text with emojis only, no special formatting or asterisks.

Property Details:
- Location: ${propertyData.property.address}
- Price: ${propertyData.property.price}
- Layout: ${propertyData.property.bedrooms} bedrooms, ${propertyData.property.bathrooms} bathrooms
- Key Features: ${propertyData.property.keyFeatures}
- Additional Information: ${propertyData.property.facts || 'None provided'}

Property Story:
${propertyData.property.description}

Agent Details:
${propertyData.agent.name}
${propertyData.agent.about || ''}

Requirements:
- Maximum length: ${CAPTION_LENGTHS[type]} characters
- Create 2-3 engaging paragraphs that flow naturally
- Use emojis thoughtfully to enhance the narrative
- Include 3-5 relevant hashtags elegantly placed
- Focus on lifestyle and emotional appeal
- End with a warm call-to-action featuring the agent
- Do not use any asterisks or special formatting characters`;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
        });

        // Remove any asterisks or markdown formatting from the generated caption
        return response.choices[0].message.content.trim().replace(/\*/g, '');
    } catch (error) {
        console.error('Error generating caption:', error);
        return null;
    }
}

// Export the function and constants
module.exports = {
    generatePropertyCaptions,
    CAPTION_TYPES
}; 