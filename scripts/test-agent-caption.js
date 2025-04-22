require('dotenv').config();
const { generatePropertyCaptions, CAPTION_TYPES } = require('../caption-generator');

// --- Test Data ---

// 1. Define a sample Agent Profile
const sampleAgentProfile = {
    name: "John Agent",
    email: "john.agent@realestate.com",
    phone: "123-456-7890"
};

// 2. Define sample Property Data (mimicking the structure passed to generatePropertyCaptions)
// This usually comes from the scraper's output (e.g., formattedData in firecrawl-rightmove-scraper.js)
const samplePropertyData = {
    property: {
        address: "123 Luxury Lane, London, SW1A 0AA",
        price: "£5,000,000",
        bedrooms: 5,
        bathrooms: 4,
        keyFeatures: "Stunning views, Private garden, Indoor pool",
        facts: "Built in 2022, Freehold",
        description: "An exceptional modern property offering the pinnacle of luxury living in a prime location. Features include stunning views, a private garden, and an indoor pool."
    },
    // The 'agent' part of this structure isn't directly used by generatePropertyCaptions,
    // but we include it for structural similarity to the real data.
    agent: { 
        name: "Scraped Agent Name", // This is NOT used by the caption generator
        address: "Scraped Agent Address",
        logo: "http://example.com/logo.png"
    }
};

// --- Test Execution ---

async function testAgentCaptionGeneration() {
    console.log("--- Testing Caption Generation with Agent Profile ---");
    console.log("Using Agent Profile:", JSON.stringify(sampleAgentProfile, null, 2));
    console.log("Using Property Data:", JSON.stringify(samplePropertyData.property, null, 2));
    console.log("\n--- Calling generatePropertyCaptions ---");

    try {
        const caption = await generatePropertyCaptions(
            samplePropertyData, 
            CAPTION_TYPES.INSTAGRAM, // Or change to FACEBOOK/LINKEDIN if needed
            sampleAgentProfile 
        );

        console.log("\n--- Generated Caption ---");
        if (caption) {
            console.log(caption);
            // Check if the agent details are present in the caption
            if (caption.includes(sampleAgentProfile.name) || caption.includes(sampleAgentProfile.email) || caption.includes(sampleAgentProfile.phone)) {
                console.log("\n✅ SUCCESS: Agent details seem to be included in the caption.");
            } else {
                console.log("\n⚠️ WARNING: Agent details might be missing from the caption. Please verify manually.");
            }
        } else {
            console.log("❌ ERROR: Caption generation returned null.");
        }
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("\n❌ ERROR during caption generation test:", error);
        console.log("--------------------------------------------------");
    }
}

// Run the test
testAgentCaptionGeneration(); 