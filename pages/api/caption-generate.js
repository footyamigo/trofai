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

    if (result && result.raw && result.raw.property) {
      // Normalize images for frontend compatibility
      const images = result.raw.property.images || result.raw.property.gallery_images || [];
      result.raw.property.galleryImages = images;
      result.raw.property.allImages = images;
      if (images.length > 0) {
        result.raw.property.mainImage = images[0];
      }
    }

    return res.status(200).json({
      success: true,
      caption: result.caption,
      property: result.raw?.property || null,
      agent: result.raw?.agent || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error generating caption.' });
  }
} 