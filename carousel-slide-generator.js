import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Generate carousel slides using Google Gemini
 * @param {Object} options - Options for the carousel (theme, focus, audience, tone, mainTitle, mainSubtitle, userName, userEmail)
 * @returns {Promise<Array<{heading: string, paragraph: string}>>}
 */
export async function generateCarouselSlides(options) {
  if (!genAI) {
    throw new Error("Gemini API key not configured.");
  }

  const {
    contentTheme,
    localFocus,
    audienceAppeal,
    toneStyle,
    mainTitle,
    mainSubtitle,
    userName,
    userEmail,
    city,
    isRegeneration,
    previousSlides
  } = options;

  // Debug log for user selections
  console.log('Prompt generation selections:', { city, contentTheme, audienceAppeal, toneStyle });

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ]
  });

  // Build system prompt and user prompt based on user selections
  const systemPrompt = `You are an expert social media copywriter creating carousel posts for Instagram. Your goal is to deliver concise, ${audienceAppeal.toLowerCase()}-friendly, and ${toneStyle.toLowerCase()} carousel content around the topic of ${contentTheme.toLowerCase()}. The tone should be clear, trustworthy, and informative. Each slide should be optimized for ${audienceAppeal.toLowerCase()} considering ${contentTheme.toLowerCase()} in ${city || 'the selected city'}. Always use the actual city name ('${city}') in the content wherever it makes sense. Keep each slide brief, using plain language and easy-to-follow tips.`;

  const userPrompt = `Create an 8-slide Instagram carousel on the topic of "${contentTheme} for ${audienceAppeal} in ${city}".\nTone: ${toneStyle}\nAudience: ${audienceAppeal}\nCity Focus: ${city}\n\nSlide format:\n1. Hook – The heading for Slide 1 must be a unique, scroll-stopping hook that grabs attention and sparks curiosity. It should never be a generic or repeated phrase. Every time you generate, you must create a completely new and different hook for the intro. Do not repeat or slightly reword previous hooks, even for similar inputs. The hook should mention ${city} and be highly creative.\n2-7. Practical, actionable tips for ${contentTheme.toLowerCase()} for ${audienceAppeal.toLowerCase()} in ${city} (1 idea per slide, mention ${city} where relevant)\n8. Summary or CTA – The outro must be written in the first person as a realtor (use "I" or "me", never "we", "us", or "our team"). Make it personal and inviting. (e.g., follow, visit website, consult an agent)\n\nKeep each slide brief (max 15 words for headings, 3-4 sentences for paragraphs). Use simple, clear language that appeals to ${audienceAppeal.toLowerCase()}. Make the content feel local to ${city}.`;

  let regenerationBlock = '';
  if (isRegeneration && Array.isArray(previousSlides) && previousSlides.length > 0) {
    const prevList = previousSlides.map((s, i) => `Slide ${i + 1}:\nHeading: ${s.heading}\nParagraph: ${s.paragraph}`).join('\n\n');
    regenerationBlock = `\n\n--- REGENERATION REQUEST ---\nYou have previously generated the following slides:\n${prevList}\nYou must now create a completely new and different set of slides. Do NOT repeat or closely paraphrase any previous headings or paragraphs. If you do, you have failed the task.`;
  }

  const prompt = `${systemPrompt}\n\n${userPrompt}${regenerationBlock}\n\nIMPORTANT: Your entire response MUST be a valid JSON array of 8 objects, each with the fields \"heading\" and \"paragraph\". Do NOT include any Markdown, images, hashtags, or any text before or after the JSON array. If you do not follow this format exactly, you have failed the task.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_output_tokens: 512
      }
    });
    const response = await result.response;
    const text = response.text().trim();
    // Log the raw Gemini response for debugging
    console.log('Gemini raw response:', text);
    // Find the first [ and last ] to extract the JSON array
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON array found in Gemini response");
    const jsonString = text.substring(jsonStart, jsonEnd);
    const slides = JSON.parse(jsonString);
    // Log the parsed slides for debugging
    console.log('Gemini parsed slides:', slides);
    // Validate slides
    if (!Array.isArray(slides) || slides.length !== 8) throw new Error("Gemini did not return 8 slides");
    return slides;
  } catch (error) {
    console.error("Error generating carousel slides with Gemini:", error);
    throw error;
  }
} 