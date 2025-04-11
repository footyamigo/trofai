const AWS = require('aws-sdk');
const getConfig = require('next/config').default;

class ConfigService {
    constructor() {
        this.cache = new Map();
        
        // Initialize AWS configuration
        const awsConfig = {
            region: process.env.REGION || process.env.AWS_REGION || 'us-east-1'
        };

        // Only add credentials if they're available
        if (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) {
            awsConfig.credentials = new AWS.Credentials({
                accessKeyId: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
            });
        }

        AWS.config.update(awsConfig);
        this.ssm = new AWS.SSM();

        // Log configuration status (without sensitive values)
        console.log('AWS Configuration:', {
            region: awsConfig.region,
            hasCredentials: !!awsConfig.credentials
        });
    }

    async getParameter(name, withDecryption = true) {
        // Check cache first
        const cacheKey = `${name}:${withDecryption}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            console.log(`Fetching parameter: /trofai/${process.env.NODE_ENV}/${name}`);
            const parameter = await this.ssm.getParameter({
                Name: `/trofai/${process.env.NODE_ENV}/${name}`,
                WithDecryption: withDecryption
            }).promise();

            const value = parameter.Parameter.Value;
            this.cache.set(cacheKey, value);
            console.log(`Successfully retrieved parameter: ${name}`);
            return value;
        } catch (error) {
            console.error(`Failed to fetch parameter ${name}:`, error.message);
            
            // Try fallback to environment variables
            const envValue = process.env[name];
            if (envValue) {
                console.log(`Using fallback environment variable for ${name}`);
                return envValue;
            }

            throw error;
        }
    }

    async getFirecrawlApiKey() {
        try {
            // Try multiple sources in order of preference
            const sources = [
                // 1. Try AWS Parameter Store
                async () => await this.getParameter('FIRECRAWL_API_KEY'),
                // 2. Try Next.js Runtime Config
                async () => {
                    const { serverRuntimeConfig } = getConfig() || {};
                    return serverRuntimeConfig?.FIRECRAWL_API_KEY;
                },
                // 3. Try Environment Variables
                async () => process.env.FIRECRAWL_API_KEY,
                // 4. Try Public Environment Variables (not recommended for sensitive data)
                async () => process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY
            ];

            for (const getSource of sources) {
                try {
                    const value = await getSource();
                    if (value) {
                        return value;
                    }
                } catch (error) {
                    console.warn('Failed to get API key from source:', error.message);
                }
            }

            throw new Error('FIRECRAWL_API_KEY not found in any configuration source');
        } catch (error) {
            console.error('Failed to retrieve Firecrawl API key:', error);
            throw error;
        }
    }

    async getBannerbearApiKey() {
        try {
            // Try multiple sources in order of preference
            const sources = [
                // 1. Try AWS Parameter Store
                async () => await this.getParameter('BANNERBEAR_API_KEY'),
                // 2. Try Next.js Runtime Config
                async () => {
                    const { serverRuntimeConfig } = getConfig() || {};
                    return serverRuntimeConfig?.BANNERBEAR_API_KEY;
                },
                // 3. Try Environment Variables
                async () => process.env.BANNERBEAR_API_KEY,
                // 4. Try Public Environment Variables (not recommended for sensitive data)
                async () => process.env.NEXT_PUBLIC_BANNERBEAR_API_KEY
            ];

            for (const getSource of sources) {
                try {
                    const value = await getSource();
                    if (value) {
                        console.log('Found Bannerbear API key from source');
                        return value;
                    }
                } catch (error) {
                    console.warn('Failed to get Bannerbear API key from source:', error.message);
                }
            }

            throw new Error('BANNERBEAR_API_KEY not found in any configuration source');
        } catch (error) {
            console.error('Failed to retrieve Bannerbear API key:', error);
            throw error;
        }
    }

    async getBannerbearProjectId() {
        try {
            console.log('Attempting to retrieve Bannerbear Project ID from multiple sources');
            
            const sources = [
                {
                    name: 'Parameter Store',
                    fn: async () => await this.getParameter('BANNERBEAR_PROJECT_ID')
                },
                {
                    name: 'Next.js Config',
                    fn: async () => {
                        const { serverRuntimeConfig } = getConfig() || {};
                        return serverRuntimeConfig?.BANNERBEAR_PROJECT_ID;
                    }
                },
                {
                    name: 'Environment Variable',
                    fn: async () => process.env.BANNERBEAR_PROJECT_ID
                },
                {
                    name: 'Public Environment Variable',
                    fn: async () => process.env.NEXT_PUBLIC_BANNERBEAR_PROJECT_ID
                },
                // Add hardcoded fallback as a last resort
                {
                    name: 'Default Fallback', 
                    fn: async () => 'E56OLrMKYWnzwl3oQj'
                }
            ];

            for (const source of sources) {
                try {
                    console.log(`Trying to get Bannerbear Project ID from ${source.name}`);
                    const value = await source.fn();
                    if (value) {
                        console.log(`Found Bannerbear Project ID from ${source.name}: ${value.substring(0, 5)}...`);
                        return value;
                    } else {
                        console.log(`${source.name} returned empty value`);
                    }
                } catch (error) {
                    console.warn(`Failed to get Bannerbear Project ID from ${source.name}:`, error.message);
                }
            }

            // If we get here, all sources failed but we should have a fallback
            const fallbackId = 'E56OLrMKYWnzwl3oQj';
            console.log(`Using hardcoded fallback Bannerbear Project ID: ${fallbackId}`);
            return fallbackId;
        } catch (error) {
            console.error('Failed to retrieve Bannerbear Project ID:', error);
            // Always return a fallback value rather than throwing
            const fallbackId = 'E56OLrMKYWnzwl3oQj';
            console.log(`Using error fallback Bannerbear Project ID: ${fallbackId}`);
            return fallbackId;
        }
    }

    async getBannerbearTemplateSetUid() {
        try {
            const sources = [
                async () => await this.getParameter('BANNERBEAR_TEMPLATE_SET_UID'),
                async () => {
                    const { serverRuntimeConfig } = getConfig() || {};
                    return serverRuntimeConfig?.BANNERBEAR_TEMPLATE_SET_UID;
                },
                async () => process.env.BANNERBEAR_TEMPLATE_SET_UID
            ];

            for (const getSource of sources) {
                try {
                    const value = await getSource();
                    if (value) {
                        console.log('Found Bannerbear Template Set UID from source');
                        return value;
                    }
                } catch (error) {
                    console.warn('Failed to get Bannerbear Template Set UID from source:', error.message);
                }
            }

            throw new Error('BANNERBEAR_TEMPLATE_SET_UID not found in any configuration source');
        } catch (error) {
            console.error('Failed to retrieve Bannerbear Template Set UID:', error);
            throw error;
        }
    }

    async getBannerbearWebhookUrl() {
        try {
            const sources = [
                async () => await this.getParameter('BANNERBEAR_WEBHOOK_URL'),
                async () => {
                    const { serverRuntimeConfig } = getConfig() || {};
                    return serverRuntimeConfig?.BANNERBEAR_WEBHOOK_URL;
                },
                async () => process.env.BANNERBEAR_WEBHOOK_URL
            ];

            for (const getSource of sources) {
                try {
                    const value = await getSource();
                    if (value) {
                        console.log('Found Bannerbear Webhook URL from source');
                        return value;
                    }
                } catch (error) {
                    console.warn('Failed to get Bannerbear Webhook URL from source:', error.message);
                }
            }

            throw new Error('BANNERBEAR_WEBHOOK_URL not found in any configuration source');
        } catch (error) {
            console.error('Failed to retrieve Bannerbear Webhook URL:', error);
            throw error;
        }
    }

    async getBannerbearWebhookSecret() {
        try {
            const sources = [
                async () => await this.getParameter('BANNERBEAR_WEBHOOK_SECRET'),
                async () => {
                    const { serverRuntimeConfig } = getConfig() || {};
                    return serverRuntimeConfig?.BANNERBEAR_WEBHOOK_SECRET;
                },
                async () => process.env.BANNERBEAR_WEBHOOK_SECRET
            ];

            for (const getSource of sources) {
                try {
                    const value = await getSource();
                    if (value) {
                        console.log('Found Bannerbear Webhook Secret from source');
                        return value;
                    }
                } catch (error) {
                    console.warn('Failed to get Bannerbear Webhook Secret from source:', error.message);
                }
            }

            throw new Error('BANNERBEAR_WEBHOOK_SECRET not found in any configuration source');
        } catch (error) {
            console.error('Failed to retrieve Bannerbear Webhook Secret:', error);
            throw error;
        }
    }

    async getAwsCredentials() {
        const accessKeyId = await this.getParameter('ACCESS_KEY_ID');
        const secretAccessKey = await this.getParameter('SECRET_ACCESS_KEY');
        return { accessKeyId, secretAccessKey };
    }

    // Add more getters for other configuration values as needed
}

// Export a singleton instance
module.exports = new ConfigService(); 