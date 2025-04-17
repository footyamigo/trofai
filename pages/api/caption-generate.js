import { scrapeRightmoveProperty } from '../../firecrawl-rightmove-scraper';
import { scrapeZillowProperty } from '../../firecrawl-zillow-scraper';
const { scrapeOnTheMarketProperty } = require('../../firecrawl-onthemarket-scraper');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid property URL' });
  }

  try {
    let result;
    if (url.includes('rightmove.co.uk')) {
      result = await scrapeRightmoveProperty(url);
    } else if (url.includes('zillow.com')) {
      result = await scrapeZillowProperty(url);
    } else if (url.includes('onthemarket.com')) {
      result = await scrapeOnTheMarketProperty(url);
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