// Server-side API endpoint for Rightmove scraping
import { scrapeRightmoveProperty } from '../../utils/firecrawl-rightmove-scraper';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log('Server-side scraping started for URL:', url);
        console.log('Environment check:', {
            FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ? 'Present' : 'Missing',
            USE_FIRECRAWL: process.env.USE_FIRECRAWL,
            NODE_ENV: process.env.NODE_ENV
        });

        const propertyData = await scrapeRightmoveProperty(url);
        res.status(200).json(propertyData);
    } catch (error) {
        console.error('Error scraping property:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to scrape property',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 