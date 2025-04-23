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

async function generatePropertyCaptions(propertyData, type = CAPTION_TYPES.INSTAGRAM, agentProfile = null, listingType = 'Just Listed') {
    try {
        // Always use agent-focused prompts
        const agentName = agentProfile?.name || "Your Name"; // Use placeholder if not available
        const agentEmail = agentProfile?.email || "your.email@example.com";
        const agentPhone = agentProfile?.phone || "Your Phone Number";

        console.log(`Generating caption in AGENT mode (defaulted) for: ${agentName}, Listing Type: ${listingType}`);
        
        // Determine the narrative focus based on listingType
        let listingStatusContext = "";
        let actionVerb = "present"; // Default verb
        let toneInstruction = "professional, knowledgeable, and enthusiastic, highlighting the unique value proposition and lifestyle appeal.";
        let callToAction = `Contact me for details: 📧 ${agentEmail} 📞 ${agentPhone}`;
        let hashtags = ["#NewListing", "#RealEstate", "#DreamHome"]; // Default hashtags

        switch (listingType) {
            case 'Just Sold':
                listingStatusContext = "This property has just been successfully sold by me.";
                actionVerb = "announce the sale of";
                toneInstruction = "celebratory and thankful, highlighting the successful outcome for my clients.";
                callToAction = `Thinking of selling or buying? Let's chat! 📧 ${agentEmail} 📞 ${agentPhone}`;
                hashtags = ["#JustSold", "#RealEstateSuccess", "#HappyClients", "#AgentLife"];
                break;
            case 'For Rent':
                listingStatusContext = "This fantastic property is now available for rent.";
                actionVerb = "introduce";
                toneInstruction = "inviting and informative, focusing on the benefits for potential renters.";
                callToAction = `Interested in renting? Contact me for a viewing: 📧 ${agentEmail} 📞 ${agentPhone}`;
                hashtags = ["#ForRent", "#RentalProperty", "#ApartmentLiving", "#HomeForRent"];
                break;
            case 'Let Agreed':
                listingStatusContext = "I'm pleased to announce this rental property has just been let (agreement secured).";
                actionVerb = "share that";
                toneInstruction = "satisfied and professional, confirming the property is now off the market.";
                callToAction = `Looking for your next rental? Let me help! 📧 ${agentEmail} 📞 ${agentPhone}`;
                hashtags = ["#LetAgreed", "#RentalSuccess", "#OffMarket", "#TenantFound"];
                break;
            case 'Just Listed':
            default:
                listingStatusContext = "I'm excited to present this property, newly listed on the market.";
                actionVerb = "present";
                toneInstruction = "professional, knowledgeable, and enthusiastic, highlighting the unique value proposition and lifestyle appeal for potential buyers.";
                // callToAction remains the default
                hashtags = ["#NewListing", "#ForSale", "#PropertyForSale", "#HouseHunting"];
                break;
        }
        
        // Add specific location/price hashtags if possible
        // (Simple example - could be more sophisticated)
        if (propertyData?.property?.address) {
          const cityMatch = propertyData.property.address.match(/,\s*([A-Za-z\s]+)(?:,\s*[A-Z]{1,2}\d{1,2}[A-Z]?\d[A-Z]{2})?$/); // Try to extract city/area
          if (cityMatch && cityMatch[1]) {
            hashtags.push(`#${cityMatch[1].replace(/\s+/g, '')}`); // Add city/area hashtag
          }
        }
        hashtags = [...new Set(hashtags)].slice(0, 5); // Keep unique, max 5

        // Combine system and user prompt for Gemini
        const fullPrompt = `You are ${agentName}, an expert real estate copywriter crafting a social media post. Your goal is to ${actionVerb} this property, reflecting its current status: **${listingType}**. 

**Status Context:** ${listingStatusContext}

Your tone should be: ${toneInstruction}

Property Details:
- Location: ${propertyData.property.address}
- Price: ${propertyData.property.price} ${listingType === 'For Rent' || listingType === 'Let Agreed' ? '(per month)' : ''} 
- Layout: ${propertyData.property.bedrooms} bedrooms, ${propertyData.property.bathrooms} bathrooms
- Key Features: ${propertyData.property.keyFeatures}
- Additional Information/Facts: ${propertyData.property.facts || 'Not specified'}
- Property Story/Description: ${propertyData.property.description}

Your Contact Info (Use ONLY in the final call-to-action):
- Name: ${agentName}
- Email: ${agentEmail}
- Phone: ${agentPhone}

**TASK:** Draft a captivating social media post about this property, writing in the first person (as ${agentName}).

**Requirements:**
1.  **Hook:** Start with a strong opening relevant to the **${listingType}** status.
2.  **Narrative:** Weave together the description, key features, and facts into a compelling story. Adapt the focus based on the **${listingType}** status (benefits for buyers/renters OR celebrating success).
3.  **Local Context:** Briefly mention specific nearby amenities or the neighborhood lifestyle, especially if Listing/For Rent.
4.  **Tone:** Maintain the specific tone instructed above based on the **${listingType}**.
5.  **Emojis:** Use 2-4 relevant emojis sparingly.
6.  **Hashtags:** Include ${hashtags.length} relevant hashtags: ${hashtags.join(' ')}.
7.  **Call-to-Action:** End *only* with the specific call-to-action: '${callToAction}'. Do not add your name here.
8.  **Formatting:** Ensure well-structured, readable text with short paragraphs. Strictly NO ASTERISKS or other markdown.
9.  **Length:** Maximum ${CAPTION_LENGTHS[type]} characters.`;

        console.log("Sending prompt to Gemini:", fullPrompt); // Log the full prompt

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