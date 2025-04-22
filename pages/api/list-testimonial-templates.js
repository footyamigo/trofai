import fetch from 'node-fetch';
import getConfig from 'next/config';
import fs from 'fs'; // Import fs to read the file
import path from 'path'; // Import path to resolve file location

// Get server config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
const BANNERBEAR_API_KEY = serverRuntimeConfig.BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY;

// Path to the configuration file
const ALLOWED_IDS_PATH = path.resolve(process.cwd(), 'config/testimonialTemplateSetIds.json');

// Helper function to format template names (borrowed from ResultsModal)
const formatTemplateName = (templateName) => {
  if (!templateName) return 'Design';
  return templateName
    .replace(/^template_/, '')
    .replace(/_image_url$/, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ').trim();
};

// --- Helper to fetch a SINGLE template set --- 
async function fetchSingleTemplateSet(uid) {
    if (!BANNERBEAR_API_KEY) {
        console.error("Bannerbear API Key is not configured.");
        return null;
    }
    console.log(`Fetching specific template set: ${uid}`);
    try {
        const response = await fetch(`https://api.bannerbear.com/v2/template_sets/${uid}?extended=true`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${BANNERBEAR_API_KEY}` }
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Failed to fetch template set ${uid}. Status: ${response.status}, Body: ${errorBody}`);
            return null; // Return null if fetch fails for this specific set
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching template set ${uid}:`, error);
        return null;
    }
}
// --- End Helper --- 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    // --- Read Allowed IDs from File ---
    let allowedTemplateSetIds = [];
    try {
        if (fs.existsSync(ALLOWED_IDS_PATH)) {
            const fileContent = fs.readFileSync(ALLOWED_IDS_PATH, 'utf-8');
            allowedTemplateSetIds = JSON.parse(fileContent);
            if (!Array.isArray(allowedTemplateSetIds)) {
                throw new Error('Config file content is not a JSON array.');
            }
            console.log(`Loaded ${allowedTemplateSetIds.length} allowed testimonial template set IDs from config.`);
        } else {
            console.warn(`Configuration file not found at ${ALLOWED_IDS_PATH}. No template sets will be loaded.`);
            // Return empty list immediately if file doesn't exist
             return res.status(200).json({ success: true, sets: [] });
        }
    } catch (error) {
        console.error(`Error reading or parsing ${ALLOWED_IDS_PATH}:`, error);
        return res.status(500).json({ success: false, message: 'Error reading template set configuration.' });
    }
    // --- End Read Allowed IDs ---

    // Exit early if no IDs are configured
    if (allowedTemplateSetIds.length === 0) {
        console.log("No allowed template set IDs configured. Returning empty list.");
        return res.status(200).json({ success: true, sets: [] });
    }

    // --- Fetch ONLY the specified template sets --- 
    try {
        console.log(`Fetching details for ${allowedTemplateSetIds.length} specified template set(s)...`);
        
        // Use Promise.allSettled to fetch all specified sets concurrently
        const results = await Promise.allSettled(
            allowedTemplateSetIds.map(uid => fetchSingleTemplateSet(uid))
        );

        // Filter out failed requests and extract successful results
        const fetchedTemplateSets = results
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);

        console.log(`Successfully fetched details for ${fetchedTemplateSets.length} template set(s).`);

        // Map the fetched sets to the format expected by TemplateSelector
        const formattedSets = fetchedTemplateSets.map(set => {
             const previews = set.templates
                ?.map(t => ({
                    name: formatTemplateName(t.name), 
                    url: t.preview_url, 
                    uid: t.uid 
                }))
                .filter(t => t.url); 

            return {
                id: set.uid, 
                name: set.name, 
                display_name: set.name, 
                description: `Contains ${set.templates?.length || 0} designs.`, 
                previewUrl: previews && previews.length > 0 ? previews[0].url : null, 
                previews: previews || [], 
                templateUids: set.templates?.map(t => t.uid) || [], 
            };
        }).filter(set => set.templateUids.length > 0); 

        console.log(`Returning ${formattedSets.length} non-empty formatted testimonial sets.`);

        return res.status(200).json({ success: true, sets: formattedSets });

    } catch (error) {
        // This catch block might be less likely to be hit now with Promise.allSettled, 
        // but keep it for unexpected errors during setup or mapping.
        console.error("Error processing specified template sets:", error);
        return res.status(500).json({ success: false, message: error.message || 'Internal server error processing template sets.' });
    }
} 