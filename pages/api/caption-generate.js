import { scrapeRightmoveProperty } from '../../firecrawl-rightmove-scraper';
import { scrapeZillowProperty } from '../../firecrawl-zillow-scraper';
const { scrapeOnTheMarketProperty } = require('../../firecrawl-onthemarket-scraper');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Get url and listingType from the request body
  const { url, listingType } = req.body;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid property URL' });
  }
  
  // Validate listingType (optional but recommended)
  const validListingTypes = ['Just Listed', 'Just Sold', 'For Rent', 'Let Agreed'];
  if (!listingType || !validListingTypes.includes(listingType)) {
    // Default to 'Just Listed' or return an error if listingType is strictly required
    console.warn(`Missing or invalid listingType: ${listingType}. Defaulting or erroring might be needed.`);
    // For now, let's proceed without it, but the scrapers might need adjustment
    // return res.status(400).json({ success: false, message: 'Missing or invalid listing type' });
  }

  try {
    let result;
    console.log(`Generating caption for URL: ${url} with Listing Type: ${listingType}`); // Log listing type
    
    if (url.includes('rightmove.co.uk')) {
      // Pass listingType to the scraper function
      result = await scrapeRightmoveProperty(url, listingType);
    } else if (url.includes('zillow.com')) {
      // Pass listingType to the scraper function
      result = await scrapeZillowProperty(url, listingType);
    } else if (url.includes('onthemarket.com')) {
      // Pass listingType to the scraper function
      result = await scrapeOnTheMarketProperty(url, listingType);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported property URL. Only Rightmove, Zillow, and OnTheMarket are supported.' });
    }

    if (!result || !result.caption) {
      return res.status(500).json({ success: false, message: 'Failed to generate caption.' });
    }

    const responseProperty = result.raw?.property || {};
    let finalImages = [];

    // Prioritize allImages if it exists and has content
    if (responseProperty.allImages && Array.isArray(responseProperty.allImages) && responseProperty.allImages.length > 0) {
      finalImages = responseProperty.allImages;
    } 
    // Fallback to images
    else if (responseProperty.images && Array.isArray(responseProperty.images) && responseProperty.images.length > 0) {
      finalImages = responseProperty.images;
    } 
    // Fallback to gallery_images
    else if (responseProperty.gallery_images && Array.isArray(responseProperty.gallery_images) && responseProperty.gallery_images.length > 0) {
      finalImages = responseProperty.gallery_images;
    }

    // Ensure mainImage is set if missing and images exist
    if (!responseProperty.mainImage && finalImages.length > 0) {
        responseProperty.mainImage = finalImages[0];
    }

    // Ensure galleryImages and allImages are consistently populated in the response object
    responseProperty.galleryImages = finalImages;
    responseProperty.allImages = finalImages;

    return res.status(200).json({
      success: true,
      caption: result.caption,
      property: responseProperty,
      agent: result.raw?.agent || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error generating caption.' });
  }
} 