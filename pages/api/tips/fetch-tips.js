// pages/api/tips/fetch-tips.js
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import AWS from 'aws-sdk';

// Configure AWS - ensure your credentials and region are configured
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = 'trofai-users';
const SESSION_INDEX = 'SessionIndex';

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// <<< Rename and Update Tip Categories >>>
const VALID_TIP_CATEGORIES = [
    'Home Selling Tip',
    'Home Buying Tip',
    'Tip for Buyers',
    'Tip for Renters',
    'Mortgage Tip'
];
// --- End Update ---

const getSessionFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// <<< Rename function getUserQuoteHistory to getUserTipHistory >>>
// TODO: Update DynamoDB attribute name later if needed (e.g., generatedTipHistory)
async function getUserTipHistory(userId) {
    console.log(`Fetching tip history for userId: ${userId}`);
    try {
        const params = {
            TableName: USERS_TABLE,
            Key: { userId },
            ProjectionExpression: "generatedTipHistory"
        };
        const data = await dynamoDb.get(params).promise();
        return data.Item?.generatedTipHistory || [];
    } catch (error) {
        console.error(`Error fetching history for userId ${userId}:`, error);
        return [];
    }
}
// <<< End Rename >>>

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const session = getSessionFromHeader(req);
    if (!session) {
        return res.status(401).json({ success: false, message: 'Unauthorized - No session token provided' });
    }

    let userId;
    try {
        const userResponse = await dynamoDb.query({
            TableName: USERS_TABLE,
            IndexName: SESSION_INDEX,
            KeyConditionExpression: '#sess = :session',
            ExpressionAttributeNames: { '#sess': 'session' },
            ExpressionAttributeValues: { ':session': session }
        }).promise();

        if (!userResponse.Items || userResponse.Items.length === 0) {
            console.log('Invalid session - no matching user found in DynamoDB');
            return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session token' });
        }
        userId = userResponse.Items[0].userId;
        console.log(`fetch-tips API: Authenticated user: ${userId}`); // <<< Updated log prefix >>>
    } catch (authError) {
        console.error('fetch-tips API - Authentication error:', authError);
        return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
    }

    if (!genAI || !API_KEY) {
        console.error('GEMINI_API_KEY is not configured or client failed to initialize.');
        return res.status(500).json({ success: false, message: 'Internal Server Error - AI configuration missing' });
    }

    try {
        const body = req.body;
        // <<< Get tip_category instead of theme >>>
        const { tip_category, forceUnique } = body; // Get forceUnique parameter
        const category = body.theme || tip_category; // <<< Handle frontend sending 'theme' temporarily >>>

        // <<< Validate against VALID_TIP_CATEGORIES >>>
        if (!category || typeof category !== 'string' || !VALID_TIP_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: 'Invalid tip category provided' });
        }

        console.log(`Fetching tip suggestions for category: ${category} for user: ${userId}, forceUnique: ${forceUnique}`);

        // --- Fetch user's history (using renamed function) ---
        // <<< Use renamed function, keep old attribute name for now >>>
        const tipHistory = await getUserTipHistory(userId);
        console.log("Fetched history count:", tipHistory.length);
        // --- End Fetch history ---

        // Define default model
        let model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7, // Default temperature
            },
        });

        let historyPromptPart = "";
        if (tipHistory.length > 0) {
            const recentHistory = tipHistory.slice(-10);
            // <<< Assuming history format is heading|advice for now >>>
            const formattedHistory = recentHistory.map(item => `- ${item.replace('|', ' - ')}`).join('\n');
            historyPromptPart = `\n\nIMPORTANT: Avoid generating tips identical or very similar to these previously generated ones:\n${formattedHistory}`;
        }

        // Add forceUnique instruction if parameter is true
        if (forceUnique) {
            // If we have previous suggestions in the request, include them for avoidance
            if (req.body.previousSuggestions && Array.isArray(req.body.previousSuggestions)) {
                const prevTips = req.body.previousSuggestions;
                historyPromptPart += "\n\nIMPORTANT - AVOID THESE SPECIFIC TIPS JUST SHOWN TO THE USER:";
                prevTips.forEach((tip, i) => {
                    if (tip.advice_heading && tip.advice) {
                        historyPromptPart += `\n${i+1}. Heading: "${tip.advice_heading}" - Advice: "${tip.advice}"`;
                    }
                });
            }
            
            historyPromptPart += "\n\nCRITICAL REGENERATION INSTRUCTIONS:";
            historyPromptPart += "\n1. This is a REGENERATION request - user has explicitly asked for COMPLETELY NEW tips.";
            historyPromptPart += "\n2. You MUST generate ALL 3 TIPS with ENTIRELY NEW advice content that wasn't used before.";
            historyPromptPart += "\n3. Process for creating each tip:";
            historyPromptPart += "\n   a. First, write the complete advice (1-3 sentences).";
            historyPromptPart += "\n   b. Then, distill this advice into a meaningful 3-word heading that captures its essence.";
            historyPromptPart += "\n   c. Make sure the 3-word heading is a complete thought, not a fragment.";
            historyPromptPart += "\n4. Each heading must be EXACTLY 3 words that form a COMPLETE, standalone phrase.";
            historyPromptPart += "\n   - Good examples: \"IMPROVE CREDIT SCORE\", \"COMPARE MULTIPLE LENDERS\", \"ENLIST BUYER\'S AGENT\"";
            historyPromptPart += "\n   - Bad examples: \"CREATE A REALISTIC\" (incomplete), \"ENLIST A BUYER\'S\" (incomplete)";
            historyPromptPart += "\n5. All advice content must be COMPLETELY DIFFERENT from any previous advice on this topic.";
            historyPromptPart += "\n6. Double-check that each 3-word heading makes complete sense as a standalone phrase AND is a complete thought.";
            
            // Increase temperature further for regeneration to ensure more diversity
            model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 1.0, // Maximum temperature for regeneration
                    candidateCount: 2, // Generate multiple candidates and pick the most different one
                },
            });
        }

        // <<< Updated Prompt for Tips >>>
        const prompt = `Generate exactly 3 unique and actionable tips for a real estate agent about "${category}".

CRITICAL REQUIREMENTS:
1.  RELEVANCE: Each tip MUST be SPECIFICALLY about ${category.toUpperCase()}, providing practical advice related to this topic.
${category === 'Mortgage Tip' ? '    IMPORTANT: These should be mortgage tips FOR CONSUMERS - advice that helps the average homebuyer, NOT advice for mortgage professionals or companies.' : ''}
2.  PROCESS: For each tip:
    a. First, think of a complete, helpful piece of advice (1-3 sentences).
    b. Then, create a concise 3-word heading that accurately summarizes this advice.
    c. The 3-word heading must be a complete, meaningful phrase that stands on its own.
    d. Do not use truncated phrases, incomplete ideas, or headings that don't make sense alone.

3.  FORMAT: For each tip, provide:
    a.  "advice_heading": A concise heading that is EXACTLY 3 complete words that form a meaningful phrase.
        Examples of good headings: "COMPARE MORTGAGE RATES", "IMPROVE CREDIT SCORE", "RESEARCH LOCAL NEIGHBORHOODS", "ENLIST BUYER'S AGENT".
        Examples of bad headings: "READ THE FINE" (incomplete), "A REALISTIC BUDGET" (not a complete phrase), "ENLIST A BUYER'S" (incomplete).
        CRITICAL: The 3 words MUST form a complete, standalone thought or command.
    b.  "advice": A short, helpful explanation or action item (1-3 sentences long).

Structure the output ONLY as a valid JSON array of objects, where each object has an "advice_heading" key (string) and an "advice" key (string).
Do not include any introductory text, markdown formatting, or explanations outside the JSON array itself.

Example format for "${category}":
[{"advice_heading": "SHOP MORTGAGE LENDERS", "advice": "Example short advice text one specific to ${category}."}, {"advice_heading": "CHECK CREDIT SCORE", "advice": "Example short advice text two specific to ${category}."}, {"advice_heading": "UNDERSTAND CLOSING COSTS", "advice": "Example short advice text three specific to ${category}."}]
${historyPromptPart}`;
        // --- End Construct prompt ---

        console.log("Sending prompt to Gemini:", prompt);

        let suggestions = [];
        let geminiError = null;

        try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            console.log("Raw Gemini Response:", text);

            try {
                suggestions = JSON.parse(text);
                // <<< Update Validation Logic >>>
                if (!Array.isArray(suggestions) || suggestions.length === 0 || !suggestions.every(s =>
                    typeof s.advice_heading === 'string' && s.advice_heading.trim() !== '' &&
                    typeof s.advice === 'string' && s.advice.trim() !== ''))
                {
                    console.error("Gemini response was not the expected JSON array structure with advice_heading and advice:", suggestions);
                    geminiError = "AI returned an unexpected data structure.";
                    suggestions = [];
                } else if (suggestions.length !== 3) {
                    console.warn(`Gemini returned ${suggestions.length} suggestions instead of 3.`);
                    // Allow proceeding
                } else {
                    // Enforce 3-word headings
                    suggestions = suggestions.map(tip => {
                        // Count words by splitting on spaces and filtering out empty strings
                        const words = tip.advice_heading.trim().split(/\s+/).filter(word => word.length > 0);
                        
                        if (words.length !== 3) {
                            console.warn(`Advice heading "${tip.advice_heading}" has ${words.length} words instead of 3. Adjusting...`);
                            
                            // If too long, truncate to first 3 words only if they make sense together
                            if (words.length > 3) {
                                const truncated = words.slice(0, 3).join(' ').toUpperCase();
                                // Only use truncated if it's likely to be meaningful
                                if (truncated.length >= 10) {
                                    tip.advice_heading = truncated;
                                } else {
                                    // Otherwise reuse the original with a warning
                                    console.warn(`Truncated heading "${truncated}" might not make sense, keeping original but in uppercase`);
                                    tip.advice_heading = tip.advice_heading.toUpperCase();
                                }
                            } 
                            // If too short, we don't add random words as they won't make semantic sense
                            // Just keep what we have but warn
                            else if (words.length < 3) {
                                console.warn(`Heading "${tip.advice_heading}" has fewer than 3 words, keeping as is but uppercase`);
                                tip.advice_heading = tip.advice_heading.toUpperCase();
                            }
                        } else {
                            // Ensure it's uppercase
                            tip.advice_heading = tip.advice_heading.toUpperCase();
                        }
                        
                        // Check for common incomplete phrases and fix them
                        const heading = tip.advice_heading.toUpperCase();
                        
                        // Common incomplete phrases to fix
                        const commonFixes = {
                            "READ THE FINE": "READ LOAN DOCUMENTS",
                            "KNOW THE FINE": "READ LOAN DOCUMENTS",
                            "CHECK THE FINE": "READ LOAN DOCUMENTS",
                            "UNDERSTAND THE FINE": "UNDERSTAND LOAN TERMS",
                            "SAVE FOR DOWN": "SAVE FOR DOWNPAYMENT",
                            "CONSIDER A DOWN": "SAVE FOR DOWNPAYMENT",
                            "IMPROVE YOUR CREDIT": "IMPROVE CREDIT SCORE",
                            "GET PRE APPROVED": "GET MORTGAGE PREAPPROVAL",
                            "UNDERSTAND CLOSING COSTS": "BUDGET CLOSING COSTS",
                            "LOOK FOR HIDDEN": "IDENTIFY HIDDEN COSTS",
                            "WATCH FOR HIDDEN": "SPOT HIDDEN FEES",
                            "CREATE A REALISTIC": "CREATE REALISTIC BUDGET",
                            "ENLIST A BUYER'S": "ENLIST BUYER'S AGENT",
                            "GET A BUYER'S": "HIRE BUYER'S AGENT"
                        };
                        
                        // Check if heading needs fixing
                        if (commonFixes[heading]) {
                            console.warn(`Fixed incomplete heading "${heading}" to "${commonFixes[heading]}"`);
                            tip.advice_heading = commonFixes[heading];
                        }
                        
                        return tip;
                    });
                }
                // --- End Update ---
            } catch (parseError) {
                 console.error("Failed to parse Gemini response as JSON:", parseError);
                 console.error("Gemini Raw Text:", text);
                 geminiError = "Failed to parse response from AI.";
            }
        } catch (apiError) {
            console.error("Error calling Gemini API:", apiError);
            return res.status(500).json({ success: false, message: 'Error communicating with AI service.' });
        }

        if (geminiError) {
             return res.status(500).json({ success: false, message: geminiError });
        }

        if (suggestions.length === 0) {
             console.error('No valid suggestions obtained after processing.');
             // <<< Update error message >>>
             return res.status(500).json({ success: false, message: 'No valid tips were generated.' });
        }

        // Success
        return res.status(200).json(suggestions); // Return array directly on success

    } catch (error) {
        console.error('[FETCH_TIPS_POST] General Error:', error); // <<< Update log prefix >>>
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
} 