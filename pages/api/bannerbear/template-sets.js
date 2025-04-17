import Bannerbear from 'bannerbear';

// Initialize Bannerbear client
// Ensure BANNERBEAR_API_KEY is set in your environment variables
const bb = new Bannerbear(process.env.BANNERBEAR_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!process.env.BANNERBEAR_API_KEY) {
    console.error('Bannerbear API Key not configured.');
    return res.status(500).json({ success: false, message: 'Server configuration error: Bannerbear API Key missing.' });
  }

  try {
    console.log('Fetching template sets from Bannerbear...');
    // Fetch template sets - BB API defaults to page 1, limit 25. Adjust if needed.
    const templateSetsResponse = await bb.list_template_sets({ page: 1, limit: 50 }); 
    console.log(`Fetched ${templateSetsResponse.length} template sets.`);

    const formattedSets = templateSetsResponse.map(set => {
      // Extract preview data for each template within the set
      const previews = set.templates
        ?.map(t => ({
          name: t.name || 'Unnamed Design',
          url: t.preview_url,
          uid: t.uid // Include UID if needed for selection later
        }))
        .filter(t => t.url); // Only include templates that have a preview URL
      
      console.log(`Processing set "${set.name}" (UID: ${set.uid}), found ${previews?.length || 0} previews.`);

      return {
        id: set.uid, 
        name: set.name, 
        description: `Contains ${set.templates?.length || 0} designs.`, 
        // Use the first preview as the main one, or null
        previewUrl: previews && previews.length > 0 ? previews[0].url : null, 
        previews: previews || [], // Include the array of preview objects
        templateUids: set.templates?.map(t => t.uid) || [],
      };
    }).filter(set => set.templateUids.length > 0); // Only include sets that actually contain templates

    console.log(`Returning ${formattedSets.length} non-empty sets.`);

    return res.status(200).json({ success: true, sets: formattedSets });

  } catch (error) {
    console.error('Error fetching or processing Bannerbear template sets:', error);
    const errorMessage = error.message || 'Failed to fetch template sets from Bannerbear.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
} 