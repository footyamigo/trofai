import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

async function generateTipCaption(advice_heading, advice, agentDetails, isRegeneration = false, currentCaption = null) {
  if (!genAI) {
    console.error("Tip Caption Generator: Gemini API key not configured.");
    return null; // Or throw an error
  }

  if (!advice_heading || !advice) {
    console.warn("Tip Caption Generator: Missing advice heading or advice text.");
    return null;
  }

  console.log(`${isRegeneration ? "Regenerating" : "Generating"} tip caption for:`, advice_heading);

  const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
         { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
         { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ]
  });

  // Extract agent details
  const agentName = agentDetails?.agent_name || 'your local real estate expert';
  const agentEmail = agentDetails?.agent_email || '';
  const agentPhone = agentDetails?.agent_number || '';
  
  // Construct contact line with emojis
  let contactText = '';
  if (agentEmail && agentPhone) {
    contactText = `Contact me for personalized advice: 📧 ${agentEmail} 📞 ${agentPhone}`;
  } else if (agentEmail) {
    contactText = `Contact me for personalized advice: 📧 ${agentEmail}`;
  } else if (agentPhone) {
    contactText = `Contact me for personalized advice: 📞 ${agentPhone}`;
  } else {
    contactText = 'Contact me for personalized advice.';
  }

  let basePrompt = `Generate a short, engaging social media caption based on the provided real estate tip.

Tip Heading: ${advice_heading}
Tip Content: ${advice}

Instructions:
1. Write a helpful, professional, and approachable caption (2-3 sentences) explaining the tip's value.
2. Keep the tone conversational and non-salesy while maintaining a professional real estate voice.
3. Write the caption in FIRST PERSON - as if I, the real estate agent, am speaking directly to my followers.
4. Add a clear call to action at the end that invites readers to reach out for more advice.
5. Include EXACTLY 4 relevant real estate hashtags.
6. DO NOT use any special formatting, asterisks, or markdown.

Output Format:
[Main body: 2-3 sentences explaining the tip]

${contactText}

[Exactly 4 hashtags]

Example Output:
Don't let hidden problems turn your dream home into a nightmare! A professional home inspection is a small investment that can save you from costly surprises like foundation damage or plumbing issues down the line. Protecting your investment starts with knowing what you're buying.

Contact me for personalized advice: 📧 jane@realestate.com 📞 555-123-4567

#HomeInspection #RealEstateTip #BuyingAHouse #PropertyAdvice`;

  // Add regeneration instructions if needed
  if (isRegeneration && currentCaption) {
    basePrompt += `\n\n--- REGENERATION REQUEST ---
Please completely rewrite the caption with a significantly different structure and wording. 
DO NOT repeat or closely paraphrase this previous version:
"${currentCaption}"`;
  }

  try {
    console.log("Sending tip caption prompt to Gemini");
    const result = await model.generateContent(basePrompt);
    const response = await result.response;
    const text = response.text();
    
    // Basic cleanup - remove potential markdown formatting or leading/trailing whitespace
    const cleanedCaption = text.replace(/\*\*/g, '').trim(); 
    return cleanedCaption;
  } catch (error) {
    console.error("Error generating tip caption with Gemini:", error);
    return null;
  }
}

export { generateTipCaption }; 