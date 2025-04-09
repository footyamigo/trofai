// API route to fetch template previews from BannerBear

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the template set ID from the request
  const { templateSetId } = req.query;
  
  if (!templateSetId) {
    return res.status(400).json({ message: 'Template set ID is required' });
  }
  
  try {
    // BannerBear API key from env vars
    const apiKey = process.env.BANNERBEAR_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'BannerBear API key not configured' });
    }

    // Fetch template set details from BannerBear API
    const response = await fetch(`https://api.bannerbear.com/v2/template_sets/${templateSetId}?extended=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('BannerBear API error:', errorData);
      return res.status(response.status).json({ 
        message: 'Error fetching template previews',
        error: errorData 
      });
    }

    const data = await response.json();
    
    // Extract preview images for the templates in this set
    let previews = [];
    
    if (data.templates && data.templates.length > 0) {
      // Get up to 5 preview images
      previews = data.templates
        .slice(0, 5)
        .map(template => ({
          id: template.uid,
          name: formatTemplateName(template.name),
          previewUrl: template.preview_url || template.sample_url || null
        }))
        .filter(template => template.previewUrl); // Filter out any without a valid preview
    }
    
    // Helper function to format template names to be more readable
    function formatTemplateName(name) {
      // Remove template_ prefix if present
      name = name.replace(/^template_/i, '');
      
      // Convert underscore or camelCase to spaces
      name = name.replace(/_/g, ' ')
                 .replace(/([A-Z])/g, ' $1')
                 .trim();
      
      // Capitalize first letter of each word
      name = name.split(' ')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                 .join(' ');
      
      return name;
    }
    
    // Return the previews
    return res.status(200).json({
      templateSetId,
      name: data.name,
      previews: previews
    });
    
  } catch (error) {
    console.error('Error fetching template previews:', error);
    return res.status(500).json({ 
      message: 'Error fetching template previews',
      error: error.message 
    });
  }
} 