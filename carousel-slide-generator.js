import OpenAI from 'openai';
import { HOOK_GUIDES } from "./constants/hookGuides";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Generate carousel slides using OpenAI GPT-4o
 * @param {Object} options - Options for the carousel
 * @returns {Promise<Array<{heading: string, paragraph: string}>>}
 */
export async function generateCarouselSlides(options) {
  if (!openai) {
    throw new Error("OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.");
  }

  const {
    contentTheme,
    localFocus,
    audienceAppeal,
    location,
    toneStyle,
    isRegeneration,
    previousSlides
  } = options;

  // Use only the first part of the location for display (e.g., 'Canary Wharf')
  const primaryLocationName = location.split(',')[0].trim();
  const topicFocusString = `${contentTheme}${localFocus && localFocus !== 'General Overview' ? ' with a focus on ' + localFocus : ''}`;

  console.log('generateCarouselSlides (OpenAI GPT-4o) received options:', { location, contentTheme, localFocus, audienceAppeal, toneStyle, primaryLocationName });

  // --- Extract previous hooks to avoid repeats ---
  const previousHookTexts = (previousSlides || [])
    .filter(slide => slide && typeof slide.heading === 'string') // Ensure slide and heading exist
    .map(slide => slide.heading.toLowerCase().trim())
    .filter(Boolean) // Remove any empty strings after trim
    .join(" | ");
  
  const regenerationInstructions = isRegeneration && previousHookTexts ? `Avoid generating hooks similar to these previous ones: [${previousHookTexts}]` : 'This is the first generation attempt.';

  // --- Hook Guide Injection ---
  let hookGuideDetails = '';
  const guideKey = Object.keys(HOOK_GUIDES).find(key => key.toLowerCase() === (audienceAppeal || '').toLowerCase());
  const hookGuide = HOOK_GUIDES[guideKey];

  if (hookGuide) {
    hookGuideDetails = `
--- Relevant Hook Writing Guide for ${audienceAppeal} ---
Key Categories: ${hookGuide.categories.join(', ')}
Style Tips: ${hookGuide.tips.join(' | ')}
Example Hooks (for inspiration, DO NOT COPY, adapt the style):
- ${hookGuide.examples.map(e => e.replace('{location}', primaryLocationName)).join('\n- ')}
--- End of Hook Guide ---
`;
  }

  // Restore getToneStyleInstruction so it is available for getToneStyleBlock
  function getToneStyleInstruction(toneStyle) {
    if (!toneStyle) return '';
    const lower = toneStyle.toLowerCase();
    if (lower.includes('personal relatability')) {
      return `\n\nTone of Voice Instructions:\n- Write in a highly personal, relatable tone.\n- Use first-person language (\"I\", \"my\", \"we\").\n- Share real-life experiences, lessons learned, or personal stories as if you are the agent.\n- Make the content feel like advice from someone who has been through it.\n- For example: \"I sold my NYC apartment in 6 days — here's how.\"`;
    }
    if (lower.includes('fomo') || lower.includes('curiosity')) {
      return `\n\nTone of Voice Instructions:\n- Write in a way that sparks curiosity and FOMO (fear of missing out).\n- Use bold statements, intriguing questions, or surprising facts.\n- Make the reader feel they must keep reading or risk missing out.`;
    }
    if (lower.includes('emotional pain')) {
      return `\n\nTone of Voice Instructions:\n- Tap into the reader's emotions and pain points.\n- Use empathetic language and highlight common struggles or frustrations.\n- Make the reader feel understood and that solutions are coming.`;
    }
    if (lower.includes('red flag') || lower.includes('cautionary')) {
      return `\n\nTone of Voice Instructions:\n- Use a cautionary, warning tone.\n- Highlight risks, red flags, and things to watch out for.\n- Use phrases like \"Don't make this mistake...\" or \"Watch out for...\"`;
    }
    if (lower.includes('insider knowledge')) {
      return `\n\nTone of Voice Instructions:\n- Write as an insider sharing tips and secrets.\n- Use phrases like \"Here's what most people don't know...\" or \"Insider tip: ...\"`;
    }
    if (lower.includes('cost saving')) {
      return `\n\nTone of Voice Instructions:\n- Focus on saving money and maximizing value.\n- Use practical, actionable advice.\n- Highlight how the reader can avoid unnecessary costs.`;
    }
    if (lower.includes('drama')) {
      return `\n\nTone of Voice Instructions:\n- Use a dramatic, storytelling style.\n- Start with a bold or shocking statement.\n- Make the stakes feel high, e.g., \"This mistake cost me $80k.\"`;
    }
    if (lower.includes('controversy')) {
      return `\n\nTone of Voice Instructions:\n- Use a provocative, controversial tone.\n- Challenge common beliefs or industry norms.\n- Use phrases like \"Your agent won't tell you this...\"`;
    }
    if (lower.includes('empathetic')) {
      return `\n\nTone of Voice Instructions:\n- Be warm, understanding, and supportive.\n- Use language that shows empathy and care for the reader's situation.`;
    }
    if (lower.includes('problem/solution') || lower.includes('benefit-oriented')) {
      return `\n\nTone of Voice Instructions:\n- Clearly state the problem, then offer a solution.\n- Focus on the benefits to the reader.\n- Use a helpful, solution-oriented tone.`;
    }
    // Default fallback
    return `\n\nTone of Voice Instructions:\n- Use the following tone: ${toneStyle}.`;
  }

  // Enhanced helper for tone instructions
  function getToneStyleBlock(toneStyle, primaryLocationName) {
    if (!toneStyle) return '';
    const lower = toneStyle.toLowerCase();
    if (lower.includes('personal relatability')) {
      return `TONE OF VOICE: PERSONAL RELATABILITY\n\nYou MUST write as if you are the agent, sharing your own personal experience and story.\n- Every slide should use first-person language (\"I\", \"my\", \"we\").\n- Make the content feel like advice from someone who has been through it.\n- Do NOT use generic or third-person statements.\n- Focus on your own journey, lessons learned, and personal insights about ${primaryLocationName}.\n- Even when sharing challenges, always end with a positive lesson, encouragement, or actionable advice.\n\nExample (for reference, do not copy):\nSlide 1: \"When I first moved to ${primaryLocationName}, I was shocked by the hidden costs no one talks about.\"\nSlide 2: \"I learned the hard way that waterfront views come with a premium...\"\n`;
    }
    // Other tones: keep original instructions and viral/bold/curiosity-driven
    return getToneStyleInstruction(toneStyle);
  }

  function getHookInstructionBlock(toneStyle, primaryLocationName) {
    const lowerTone = toneStyle ? toneStyle.toLowerCase() : '';

    if (lowerTone.includes('personal relatability')) {
      return `
1.  **Slide 1: THE PERSONAL HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a deeply personal, scroll-stopping hook from YOUR (the agent\'s) perspective. It should share a genuine experience, a lesson learned, or a surprising personal insight about ${primaryLocationName}. Use first-person ("I", "My", "We").
        -   Example Style: "The one thing I wish I knew before moving to ${primaryLocationName}...", "My unexpected discovery in ${primaryLocationName} that changed everything...", "How I found my dream spot in ${primaryLocationName} against all odds..."
        -   It must be hyper-specific to YOUR personal experience in ${primaryLocationName} and instantly relatable.
        -   Do NOT use generic phrases. Be authentic, share a real story snippet, and connect emotionally.
    -   **Paragraph (2-4 sentences):** Briefly expand on your personal hook. Hint at the story or insight you\'re about to share. Clearly state that the following slides will delve deeper into your experience or the lessons you learned in ${primaryLocationName}.
`;
    } else if (lowerTone.includes('fomo') || lowerTone.includes('curiosity')) {
      return `
1.  **Slide 1: THE FOMO/CURIOSITY HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a hook that creates intense FOMO (Fear Of Missing Out) or piques strong CURIOSITY about ${primaryLocationName}. Use intriguing questions, bold statements, or hints of exclusive information.
        -   Example Style: "Is this ${primaryLocationName}'s best-kept secret about to be exposed?", "What NO ONE is telling you about ${primaryLocationName}...", "You won\'t believe what's happening in ${primaryLocationName} right now..."
        -   It must make the reader feel they absolutely NEED to know more or risk missing out on something vital about ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Briefly expand on the hook, teasing the information or secret that will be revealed. Promise to unveil the details in the following slides.
`;
    } else if (lowerTone.includes('emotional pain')) {
      return `
1.  **Slide 1: THE PAIN POINT HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST directly address a common EMOTIONAL PAIN POINT or frustration related to the topic in ${primaryLocationName}. Use empathetic language that resonates with a struggle.
        -   Example Style: "Tired of [common problem] in ${primaryLocationName}?", "The real reason finding [something] in ${primaryLocationName} feels impossible...", "Feeling [negative emotion] about [topic] in ${primaryLocationName}? You\'re not alone."
        -   It should make the reader feel understood and validated in their struggle concerning ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Acknowledge the pain point further and reassure the reader that the following slides will offer understanding, solutions, or a new perspective on this ${primaryLocationName}-specific issue.
`;
    } else if (lowerTone.includes('red flag') || lowerTone.includes('cautionary')) {
      return `
1.  **Slide 1: THE CAUTIONARY HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a hook that raises a RED FLAG or offers a CAUTIONARY warning about the topic in ${primaryLocationName}. Use direct, attention-grabbing language.
        -   Example Style: "Warning: Don\'t even THINK about [action] in ${primaryLocationName} until you read this.", "The biggest mistake people make with [topic] in ${primaryLocationName}.", "Red Flag: Is your [something] in ${primaryLocationName} a trap?"
        -   It should make the reader pause and consider a potential risk or pitfall related to ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Briefly explain the nature of the warning/red flag and promise to detail the risks and how to avoid them in the context of ${primaryLocationName} in the upcoming slides.
`;
    } else if (lowerTone.includes('insider knowledge')) {
      return `
1.  **Slide 1: THE INSIDER HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST offer a piece of INSIDER KNOWLEDGE or a tip/secret about ${primaryLocationName} that isn\'t widely known. Frame it as exclusive information.
        -   Example Style: "The ${primaryLocationName} secret only locals know about [topic]...", "Insider Tip: How to really [achieve something] in ${primaryLocationName}.", "What most don\'t realize about [topic] in ${primaryLocationName}..."
        -   It should make the reader feel they are about to gain a valuable, non-obvious insight into ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Hint at the exclusive nature of the information and promise to reveal these insider details about ${primaryLocationName} in the following slides.
`;
    } else if (lowerTone.includes('cost saving')) {
      return `
1.  **Slide 1: THE COST-SAVING HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST highlight a significant COST-SAVING opportunity or financial tip related to ${primaryLocationName}. Be specific about the potential savings or value.
        -   Example Style: "Save thousands on [topic] in ${primaryLocationName} with this one trick.", "How I cut my [related cost] in ${primaryLocationName} by X%...", "Unlock hidden value in ${primaryLocationName}'s [market/topic]."
        -   It should immediately appeal to the reader's desire to save money or get more value in ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Briefly state the potential for savings or value and promise to explain the methods or strategies for achieving this in ${primaryLocationName} in the next slides.
`;
    } else if (lowerTone.includes('drama')) {
      return `
1.  **Slide 1: THE DRAMATIC HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a DRAMATIC or shocking statement related to the topic in ${primaryLocationName}. Aim for high stakes or a surprising revelation.
        -   Example Style: "The ${primaryLocationName} [topic] disaster that almost cost me everything.", "What really happened with [event/situation] in ${primaryLocationName}...", "The unbelievable truth about [topic] in ${primaryLocationName}."
        -   It should create a sense of urgency and make the reader want to know the full story concerning ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Set the stage for the dramatic story or revelation, promising to unfold the details and lessons learned in the context of ${primaryLocationName} in the following slides.
`;
    } else if (lowerTone.includes('controversy')) {
      return `
1.  **Slide 1: THE CONTROVERSIAL HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a PROVOCATIVE or CONTROVERSIAL statement/question about the topic in ${primaryLocationName}. Challenge common beliefs or norms.
        -   Example Style: "Why everything you\'ve heard about [topic] in ${primaryLocationName} is wrong.", "The unpopular truth about ${primaryLocationName}'s [industry/topic]...", "Are agents lying about [topic] in ${primaryLocationName}?"
        -   It should spark debate or make the reader question their assumptions about ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Briefly introduce the controversial stance and promise to explore this alternative viewpoint or expose a hidden truth regarding ${primaryLocationName} in the subsequent slides.
`;
    } else if (lowerTone.includes('empathetic')) {
      return `
1.  **Slide 1: THE EMPATHETIC HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a warm, UNDERSTANDING, and supportive statement acknowledging a challenge or aspiration related to ${primaryLocationName}.
        -   Example Style: "Navigating ${primaryLocationName}'s [topic] can be tough, but you\'re not alone.", "Dreaming of [goal] in ${primaryLocationName}? I see you.", "It\'s okay to feel [emotion] about [topic] in ${primaryLocationName}."
        -   It should make the reader feel seen, understood, and supported in their ${primaryLocationName}-related journey.
    -   **Paragraph (2-4 sentences):** Expand with empathy, validating their feelings or situation, and promise guidance, support, or understanding for their ${primaryLocationName} experience in the slides to come.
`;
    } else if (lowerTone.includes('problem/solution') || lowerTone.includes('benefit-oriented')) {
      return `
1.  **Slide 1: THE PROBLEM/SOLUTION HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST clearly state a common PROBLEM in ${primaryLocationName} and hint at a SOLUTION, or directly highlight a key BENEFIT.
        -   Example Style: "The Easiest Way to Solve [Problem] in ${primaryLocationName}.", "Unlock [Benefit] in ${primaryLocationName} Today!", "[Problem] in ${primaryLocationName}? Here\'s the Fix."
        -   It should be direct, actionable, and promise clear value to the reader regarding ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Briefly elaborate on the problem/solution or the benefit, and clearly state that the following slides will provide the steps, details, or reasons for this ${primaryLocationName}-specific solution/benefit.
`;
    } else {
      // Default hook instructions
      return `
1.  **Slide 1: THE HOOK (Heading & Paragraph)**
    -   **Heading (Max 12 words):** This MUST be a JAW-DROPPINGLY GOOD, scroll-stopping hook. It must create a strong emotional reaction (curiosity, FOMO, surprise, urgency) and be **hyper-specific to ${primaryLocationName}**. It should feel like a local secret or a bold, must-share insight about ${primaryLocationName}.
        -   Think: shocking local fact, hidden ${primaryLocationName} truth, provocative question about ${primaryLocationName}, surprising statistic, bold contrarian claim relevant to ${primaryLocationName}.
        -   It must NEVER be generic or applicable to other locations.
        -   Do NOT use generic phrases. Be brave, creative, and push boundaries.
    -   **Paragraph:** Briefly expand on the hook, setting the stage for the carousel's topic and clearly stating that the following slides will explain the reasons/factors.
`;
    }
  }

  const systemMessageContent = `
${getToneStyleBlock(toneStyle, primaryLocationName)}
You are an expert social media copywriter specializing in Instagram carousels.
Your **primary mission** is to create **hyperlocal content** deeply tied to ${primaryLocationName}.
All other instructions support this core mission.
ALL CONTENT MUST BE POSITIVE, ENCOURAGING, AND SOLUTION-ORIENTED. Avoid negativity, fear-mongering, or discouraging language. The goal is to inspire trust and make the reader feel empowered to take action.
Your goal is to create content that is:
1.  **Hyperlocal & Specific:** Content MUST be unmistakably about ${primaryLocationName} and not generic.
2.  **Engaging:** ${audienceAppeal.toLowerCase()}-friendly.
${toneStyle && toneStyle.toLowerCase().includes('personal relatability') ? '' : '3.  **Informative & Trustworthy:** ' + (toneStyle ? toneStyle.toLowerCase() : 'educational and informative') + ' in tone.\n4.  **Viral-Potential:** Bold, curiosity-driven, and shareable.'}
${!toneStyle || !toneStyle.toLowerCase().includes('personal relatability') ? getToneStyleInstruction(toneStyle) : ''}

You must output a single, valid JSON object. This object MUST have a root key named "slides".
The value of "slides" MUST be an array of exactly 8 (EIGHT) distinct slide objects.
Each slide object MUST have a "heading" (string, max 12 words for hook, max 10 for others) and a "paragraph" (string, 2-4 sentences).
Strictly adhere to this JSON format: {"slides": [{"heading":"H1","paragraph":"P1"}, {"heading":"H2","paragraph":"P2"}, {"heading":"H3","paragraph":"P3"}, {"heading":"H4","paragraph":"P4"}, {"heading":"H5","paragraph":"P5"}, {"heading":"H6","paragraph":"P6"}, {"heading":"H7","paragraph":"P7"}, {"heading":"H8","paragraph":"P8"}]}
Absolutely no Markdown, no introductory text, no explanations, and NO EMOJIS in your response.
${regenerationInstructions}
${hookGuideDetails}
If a hook guide is provided, use it to inspire the style and energy of the hook for the first slide.
`.trim();

  const userMessageContent = `Create an 8-slide Instagram carousel about "${topicFocusString} in ${primaryLocationName}".
This carousel MUST be focused on ${primaryLocationName}. Generic content is not acceptable.
Target Audience: ${audienceAppeal}.
Primary Location Focus: ${primaryLocationName}.
Specific Angle/Local Focus (if any): ${localFocus && localFocus !== 'General Overview' ? localFocus : 'General Overview/Not specified'}.

Remember: The final output must be a JSON object containing an array named "slides" with exactly 8 slide objects, all relevant to ${primaryLocationName}.

Slide Structure (8 slides total, all content specific to ${primaryLocationName}):
${getHookInstructionBlock(toneStyle, primaryLocationName)}

2.  **Slides 2-7: EXPLAINING THE "WHY" (Heading & Paragraph per slide)**
    -   **Crucial & Direct Instruction:** These slides MUST directly explain the reasons or factors behind the statement/question in YOUR hook on Slide 1. For example, if Slide 1 asks "Why have rents skyrocketed?", each of these slides (2-7) must present a distinct CAUSE or CONTRIBUTING FACTOR to that rent increase in ${primaryLocationName}.
    -   **Heading (Max 10 words):** State a specific cause or factor that directly answers/explains the hook on Slide 1. This must be specifically relevant to ${primaryLocationName}.
    -   **Paragraph (2-4 sentences):** Elaborate on how this specific cause/factor contributes to the situation described in Slide 1. Provide hyper-local details, evidence, or examples from ${primaryLocationName}. Ensure a clear, logical link back to the hook.

3.  **Slide 8: CTA or CLOSING INSIGHT (Heading & Paragraph)**
    -   **Heading (Max 10 words):** Short, engaging, and related to the CTA/summary.
    -   **Paragraph (2-4 sentences):** Written in the first person (as the agent, e.g., "I can help you...", "Reach out to me..."). Encourage engagement (e.g., "Drop a comment", "Send a DM").

Overall Instructions:
-   Maintain a ${toneStyle ? toneStyle : 'educational and informative'} yet bold and curiosity-driven tone throughout.
-   Ensure all content is hyperlocal and directly relevant to ${primaryLocationName}.
-   ABSOLUTELY CRITICAL: All content must be hyperlocal, specific, and demonstrably tied to ${primaryLocationName}. Do not provide generic advice.
-   No emojis anywhere.
-   Produce exactly 8 slides.
-   Adhere strictly to the JSON output format specified in the system prompt.
`.trim();
  
  try {
    console.log("Attempting to generate slides with OpenAI GPT-4o...");
    // console.log("System Prompt:", systemMessageContent); // Optional: For deep debugging
    // console.log("User Prompt:", userMessageContent); // Optional: For deep debugging

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessageContent },
        { role: 'user', content: userMessageContent },
      ],
      temperature: 1.0, // Balanced for creativity and coherence
      frequency_penalty: 0.4,
      presence_penalty: 0.8, 
      max_tokens: 2000, 
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    // console.log('OpenAI raw response content:', responseContent); // Optional: For deep debugging

    if (!responseContent) {
      throw new Error("OpenAI returned an empty response content.");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse JSON response from OpenAI:", responseContent, "Error:", e);
      throw new Error(`Failed to parse JSON response: ${e.message}. Raw response was: ${responseContent}`);
    }

    if (!parsedResponse || !Array.isArray(parsedResponse.slides)) {
      console.error("OpenAI response is not in the expected format (expected object with a 'slides' array):", parsedResponse);
      throw new Error("OpenAI response did not contain a 'slides' array in the expected structure.");
    }

    const slides = parsedResponse.slides;

    if (slides.length !== 8) {
      console.error(`OpenAI returned ${slides.length} slides, but 8 were expected.`, slides);
      throw new Error(`OpenAI returned ${slides.length} slides, but 8 were expected.`);
    }

    slides.forEach((slide, index) => {
      if (typeof slide.heading !== 'string' || typeof slide.paragraph !== 'string') {
        console.error(`Slide ${index + 1} is malformed:`, slide);
        throw new Error(`Slide ${index + 1} is malformed. Expected {heading: string, paragraph: string}.`);
      }
    });
    
    console.log('OpenAI successfully parsed slides:', slides.length, 'slides');

    // Ensure the first slide's heading starts with a capital letter
    if (slides.length > 0 && slides[0].heading && typeof slides[0].heading === 'string') {
      const trimmedHeading = slides[0].heading.trim(); // Trim whitespace first
      slides[0].heading = trimmedHeading.charAt(0).toUpperCase() + trimmedHeading.slice(1);
    }

    // Transform to 9-slide structure
    const transformedSlides = [
      { heading: slides[0].heading }, // Slide 1: heading only
      { paragraph: slides[0].paragraph }, // Slide 2: paragraph only
      ...slides.slice(1).map(s => ({ heading: s.heading, paragraph: s.paragraph })) // Slides 3-9
    ];

    // Log the content of all slides JUST BEFORE returning
    console.log('Final content of all generated slides (from backend, after transformation to 9 slides):', JSON.stringify(transformedSlides, null, 2));
    return transformedSlides;

  } catch (error) {
    console.error("Error generating carousel slides with OpenAI:", error);
    if (error.response) { // Axios-style error object from older SDKs or direct HTTP calls
      console.error("OpenAI API Error Status (from error.response):", error.response.status);
      console.error("OpenAI API Error Data (from error.response):", error.response.data);
    } else if (error.status) { // OpenAI SDK v4+ style error
        console.error("OpenAI API Error Status (from error.status):", error.status);
        console.error("OpenAI API Error Headers:", error.headers);
        console.error("OpenAI API Error Body:", error.error); // error.error often contains the JSON error details
    }
    // Construct a more informative error message
    const errorMessage = error.error?.message || error.message || "Unknown error during OpenAI call.";
    throw new Error(`OpenAI API Error: ${errorMessage}`); 
  }
} 