const fetch = require('node-fetch');
const { generatePropertyCaptions, CAPTION_TYPES } = require('../caption-generator');
const getConfig = require('next/config').default;
const configService = require('./config-service');

// ... rest of the imports and configuration ...

async function generateBannerbearImage(propertyData) {
    try {
        // Get Bannerbear credentials from Parameter Store
        const apiKey = await configService.getBannerbearApiKey();
        const webhookUrl = await configService.getParameter('BANNERBEAR_WEBHOOK_URL');
        const webhookSecret = await configService.getParameter('BANNERBEAR_WEBHOOK_SECRET');
        const projectId = await configService.getParameter('BANNERBEAR_PROJECT_ID');

        const bannerbearPayload = {
            ...propertyData.bannerbear,
            project_id: projectId || 'E56OLrMKYWnzwl3oQj'
        };

        // Add webhook configuration
        if (webhookUrl) {
            bannerbearPayload.webhook_url = webhookUrl;
            bannerbearPayload.webhook_headers = {
                'Authorization': `Bearer ${webhookSecret}`
            };
        }

        console.log('Sending Bannerbear request with payload:', JSON.stringify(bannerbearPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bannerbearPayload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Bannerbear API Error:', error);
            throw new Error(`Bannerbear API error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Bannerbear image generation initiated:', result);

        // Return immediately with UID for webhook tracking
        return {
            uid: result.uid,
            status: result.status,
            webhook_url: bannerbearPayload.webhook_url
        };
    } catch (error) {
        console.error('Error generating Bannerbear image:', error);
        throw error;
    }
}

async function generateBannerbearCollection(propertyData, templateSetUid) {
    try {
        // Get Bannerbear credentials from all possible sources
        const apiKey = await configService.getBannerbearApiKey();
        const webhookUrl = await configService.getBannerbearWebhookUrl();
        const webhookSecret = await configService.getBannerbearWebhookSecret();
        const projectId = await configService.getBannerbearProjectId();

        // Get all available property images
        const propertyImages = propertyData.raw.property.allImages;
        console.log('Available property images:', propertyImages.length);

        // Create base modifications for common fields
        const baseModifications = [
            {
                name: "property_price",
                text: propertyData.raw.property.price
            },
            {
                name: "property_location",
                text: propertyData.raw.property.address
            },
            {
                name: "bedrooms",
                text: propertyData.raw.property.bedrooms
            },
            {
                name: "bathrooms",
                text: propertyData.raw.property.bathrooms
            },
            {
                name: "logo",
                image_url: propertyData.raw.agent.logo
            },
            {
                name: "estate_agent_address",
                text: propertyData.raw.agent.address
            }
        ];

        // Add image modifications for each template
        const imageModifications = [];
        for (let i = 0; i <= 23; i++) {
            const layerName = i === 0 ? "property_image" : `property_image${i}`;
            // Use modulo to cycle through available images
            const imageIndex = i % propertyImages.length;
            
            imageModifications.push({
                name: layerName,
                image_url: propertyImages[imageIndex]
            });
        }

        // Prepare the collection payload
        const collectionPayload = {
            template_set: templateSetUid,
            modifications: [...baseModifications, ...imageModifications],
            project_id: projectId,
            metadata: {
                source: "zillow",
                scraped_at: new Date().toISOString(),
                total_images: propertyImages.length
            }
        };

        // Add webhook configuration if available
        if (webhookUrl) {
            collectionPayload.webhook_url = webhookUrl;
            collectionPayload.webhook_headers = {
                'Authorization': `Bearer ${webhookSecret}`
            };
        }

        console.log('Sending Bannerbear collection request with payload:', JSON.stringify(collectionPayload, null, 2));

        const response = await fetch('https://api.bannerbear.com/v2/collections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(collectionPayload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Bannerbear Collection API Error:', error);
            throw new Error(`Bannerbear Collection API error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Bannerbear collection generation initiated:', result);

        // Return collection info for tracking
        return {
            uid: result.uid,
            status: result.status,
            webhook_url: collectionPayload.webhook_url,
            template_set: templateSetUid
        };
    } catch (error) {
        console.error('Error generating Bannerbear collection:', error);
        throw error;
    }
}

// ... rest of the existing code ... 