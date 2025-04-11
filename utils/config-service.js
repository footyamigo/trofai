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
        return await this.getParameter('BANNERBEAR_API_KEY');
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