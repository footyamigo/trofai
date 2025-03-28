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
        const systemPrompt = `You are an expert luxury real estate copywriter specializing in creating compelling, sophisticated property descriptions for high-end real estate agencies.

Your task is to craft an engaging property description that:
1. Opens with a captivating hook about the property's most impressive feature
2. Weaves in the agent's expertise and local market knowledge
3. Highlights key location benefits and lifestyle opportunities
4. Creates urgency and desire through emotive language
5. Positions the property's unique value proposition
6. Includes a strong call-to-action featuring the agent

For rental properties:
- Focus on lifestyle and convenience aspects
- Highlight proximity to transport, amenities, and workplaces
- Emphasize move-in readiness and available dates
- Mention any included amenities or bills
- Use terms like "your new home" and "make this home yours"

Style guidelines:
- Write in a sophisticated, aspirational tone
- Use rich, descriptive language that appeals to emotions and lifestyle
- Break text into readable paragraphs with emojis as subtle section breaks
- Include relevant hashtags that target both property and location
- Emphasize the agent's expertise and market knowledge
- Format numbers professionally (e.g., "six-bedroom" instead of "6-bed")
- For rentals, use "per calendar month" or "pcm" appropriately`;

        const maxTokens = Math.floor(CAPTION_LENGTHS[type] * 1.5);

        const userPrompt = `Create a ${type} property caption that positions this property perfectly for the market. Use these details:

Property Specifications:
- Address: ${propertyData.property.address}
- Price: ${propertyData.property.price}
- Configuration: ${propertyData.property.bedrooms} bedrooms, ${propertyData.property.bathrooms} bathrooms
- Key Features: ${propertyData.property.keyFeatures}

Full Property Description:
${propertyData.property.description}

Agent Expertise:
Agency: ${propertyData.agent.name}
About the Agency: ${propertyData.agent.about}

Requirements:
- Maximum length: ${CAPTION_LENGTHS[type]} characters
- Create 3-4 paragraphs with natural breaks
- Include 5-7 relevant hashtags
- Add appropriate emojis for visual breaks
- End with a compelling call-to-action featuring the agent
- Emphasize unique selling points and investment potential
- Highlight local area benefits and lifestyle opportunities`;

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

        return response.choices[0].message.content.trim();
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