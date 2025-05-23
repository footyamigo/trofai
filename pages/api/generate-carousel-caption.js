const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ],
});

const CAPTION_PART_DELIMITER = '|||---NEW_CAPTION_PART---|||';

async function generateCarouselCaptionText(slides, agentProfile, mainTitle = '', contentTheme = '', toneStyle = 'Warm, enthusiastic, knowledgeable, and approachable') {
  // agentProfile can be used for deeper context if needed in future iterations

  let slideContentSummary = slides.map((slide, index) => {
    return `Slide ${index + 1} - Heading: ${slide.heading}\nSlide ${index + 1} - Text: ${slide.paragraph}`;
  }).join('\n\n');

  if (slideContentSummary.length > 2000) { // Increased limit for more context for hashtags and summary
    slideContentSummary = slideContentSummary.substring(0, 2000) + "... (summary truncated)";
  }
  
  const themeInfo = contentTheme ? `The overall theme of the carousel is "${contentTheme}".` : '';
  const titleInfo = mainTitle ? `The main title for the carousel is "${mainTitle}".` : '';

  const prompt = `
You are an expert social media copywriter for a real estate agent. Your task is to generate a compelling and engaging Instagram caption for a multi-slide carousel post.

Your Goal: Craft a caption that grabs attention, provides valuable context from the slides, encourages viewers to swipe through, and naturally leads to engagement. It should feel personal and come directly from the agent.

${titleInfo}
${themeInfo}

Key information from the carousel slides (use this to draw out key themes, benefits, or tips):
---
${slideContentSummary}
---

Instructions for the caption body (excluding CTA and hashtags, which will be handled separately by the system):
You will generate three distinct parts for the main caption body. Concatenate these parts using the delimiter "${CAPTION_PART_DELIMITER}" exactly as written, with no spaces around it.

Part 1: Opening Hook
  - 1-2 attention-grabbing sentences related to the carousel's topic.
  - Each sentence MUST be on a new line.

Part 2: Context & Value
  - 1-2 sentences summarizing the core message or benefit, weaving in details/keywords from the slides.
  - Each sentence MUST be on a new line.

Part 3: Encourage Interaction
  - 1 sentence subtly prompting viewers to swipe through (e.g., "Swipe to discover...", "Dive into the slides...").
  - This sentence MUST be on a new line.

Overall Tone for all parts: ${toneStyle} first-person tone (as the agent).
Length: Aim for 3-5 engaging sentences in total across all three parts.
Format: Plain text only. No markdown or asterisks within the parts.

Example of the structure you should return for the caption body:
[Sentence 1 of Hook]\n[Sentence 2 of Hook (if any)]${CAPTION_PART_DELIMITER}[Sentence 1 of Context/Value]\n[Sentence 2 of Context/Value (if any)]${CAPTION_PART_DELIMITER}[Sentence 1 of Interaction Prompt]

Instructions for Hashtags (provide these separately AFTER the entire caption body, prefixed with "HASHTAGS:"):
1.  Generate 3-5 relevant and effective hashtags.
2.  Mix general real estate/topic hashtags with more specific ones if possible.
3.  Example format: HASHTAGS: #RealEstateTips #HomeBuying #LondonProperty #FirstTimeBuyer #DreamHome

Generate the main caption body (Part 1${CAPTION_PART_DELIMITER}Part 2${CAPTION_PART_DELIMITER}Part 3) first, then on a new line provide the HASHTAGS section.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let fullText = response.text();
    
    // Sanitize the full text initially
    fullText = fullText.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    let captionBodyPartsString = '';
    let hashtagsString = '';

    const hashtagSplit = fullText.split("HASHTAGS:");
    captionBodyPartsString = hashtagSplit[0].trim();
    if (hashtagSplit.length > 1) {
      hashtagsString = hashtagSplit[1].trim();
    }
    
    const parts = captionBodyPartsString.split(CAPTION_PART_DELIMITER);
    const processedParts = parts.map(part => 
      part.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')
    ).filter(part => part.length > 0);
    
    const captionBody = processedParts.join('\n\n'); // Join the main parts with a double newline

    return { captionBody, hashtags: hashtagsString }; // Return as an object

  } catch (error) {
    console.error('Error generating carousel caption with Google Gemini:', error);
    if (error.message && error.message.includes('API key not valid')) {
      console.error("Check your GOOGLE_API_KEY in the .env file.");
    }
    const fallbackBody = mainTitle || contentTheme || "Discover valuable insights in this carousel!";
    return { captionBody: fallbackBody, hashtags: "#RealEstate #Carousel #Tips" }; // Fallback with generic hashtags
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { slides, agentProfile, mainTitle, contentTheme, toneStyle } = req.body;

  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    return res.status(400).json({ success: false, message: 'Slides data is required and must be a non-empty array.' });
  }
  if (!agentProfile) {
    return res.status(400).json({ success: false, message: 'Agent profile is required.' });
  }

  const { agentEmail = 'your.email@example.com', agentPhone = '' } = agentProfile;

  try {
    const { captionBody, hashtags } = await generateCarouselCaptionText(slides, agentProfile, mainTitle, contentTheme, toneStyle);
    
    let callToAction = "Ready to learn more or have questions? Drop a comment or send me a message!";
    const contactDetails = [];
    if (agentEmail && agentEmail !== 'your.email@example.com') contactDetails.push(`📧 ${agentEmail}`);
    if (agentPhone) contactDetails.push(`📞 ${agentPhone}`); // Only add if phone exists
    
    if (contactDetails.length > 0) {
      callToAction += `\nYou can also reach me directly: ${contactDetails.join(' | ')}`;
    }

    // Ensure captionBody is joined with callToAction and hashtags with double newlines for paragraph breaks
    let finalCaption = captionBody; // captionBody should now have its internal newlines
    if (finalCaption && callToAction) {
        finalCaption += `\n\n${callToAction}`;
    } else if (callToAction) {
        finalCaption = callToAction;
    }

    if (hashtags) {
      if (finalCaption) {
        finalCaption += `\n\n${hashtags}`;
      } else {
        finalCaption = hashtags;
      }
    }

    return res.status(200).json({ success: true, caption: finalCaption });
  } catch (error) {
    console.error('Error in /api/generate-carousel-caption handler:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate carousel caption.' });
  }
} 