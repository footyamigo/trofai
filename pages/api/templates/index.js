import fetch from 'node-fetch';

const DUPLICATED_TAG = "app-duplicated"; // Use the same tag constant

// Helper function now accepts NO tag
async function fetchTemplatePage(apiKey, page, limit) {
  let bannerbearApiUrl = `https://api.bannerbear.com/v2/templates?page=${page}&limit=${limit}`;
  // Removed tag logic
  
  console.log(`Fetching templates: ${bannerbearApiUrl}`); 
  
  const response = await fetch(bannerbearApiUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorBody = 'Unknown error';
    try {
      errorBody = await response.json();
    } catch (e) { /* Ignore */ }
    // Removed tag from error log
    console.error(`Bannerbear API Error (Page ${page}): ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Failed to fetch templates page ${page}. Status: ${response.status}`);
  }

  return await response.json();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const apiKey = process.env.BANNERBEAR_API_KEY;
  if (!apiKey) {
    console.error('BANNERBEAR_API_KEY environment variable not set.');
    return res.status(500).json({ message: 'Server configuration error: API key missing.' });
  }

  // Get page and limit - REMOVED filterTag
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  // const filterTag = req.query.filterTag || null; // REMOVED

  try {
    // Fetch the requested page - REMOVED tag parameter
    const templatesRaw = await fetchTemplatePage(apiKey, page, limit);

    // Filter out templates with the specific tag
    const templatesFiltered = templatesRaw.filter(template => 
      !template.tags || !template.tags.includes(DUPLICATED_TAG)
    );

    // Determine if Bannerbear *might* have more pages 
    // (based on the raw count before filtering)
    const hasMorePotential = templatesRaw.length === limit;
    
    // If filtering removed all items on this page, but there might be more
    // pages on Bannerbear, we should indicate `hasMore` is true so the
    // frontend tries fetching the next page.
    const hasMore = templatesFiltered.length === 0 ? hasMorePotential : (templatesFiltered.length > 0 && hasMorePotential);

    console.log(`Page ${page}: Fetched ${templatesRaw.length}, Filtered to ${templatesFiltered.length}, HasMore: ${hasMore}`);

    return res.status(200).json({ templates: templatesFiltered, hasMore });

  } catch (error) {
    // Removed tag from error log
    console.error(`Error fetching/filtering templates page ${page}:`, error);
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
} 