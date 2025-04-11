import configService from '../../utils/config-service';

export default async function handler(req, res) {
    try {
        // Test retrieving various types of parameters
        const testResults = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            tests: {
                // Test API Keys (will only show if they exist, not the actual values)
                firecrawl: {
                    success: false,
                    error: null,
                    hasKey: false
                },
                bannerbear: {
                    success: false,
                    error: null,
                    hasKey: false
                },
                openai: {
                    success: false,
                    error: null,
                    hasKey: false
                },
                // Test non-sensitive configuration
                dynamodb: {
                    success: false,
                    error: null,
                    tables: {}
                },
                aws: {
                    success: false,
                    error: null,
                    hasCredentials: false
                }
            }
        };

        // Test Firecrawl API Key
        try {
            const firecrawlKey = await configService.getFirecrawlApiKey();
            testResults.tests.firecrawl.success = true;
            testResults.tests.firecrawl.hasKey = !!firecrawlKey;
        } catch (error) {
            testResults.tests.firecrawl.error = error.message;
        }

        // Test Bannerbear API Key
        try {
            const bannerbearKey = await configService.getBannerbearApiKey();
            testResults.tests.bannerbear.success = true;
            testResults.tests.bannerbear.hasKey = !!bannerbearKey;
        } catch (error) {
            testResults.tests.bannerbear.error = error.message;
        }

        // Test OpenAI API Key
        try {
            const openaiKey = await configService.getParameter('OPENAI_API_KEY');
            testResults.tests.openai.success = true;
            testResults.tests.openai.hasKey = !!openaiKey;
        } catch (error) {
            testResults.tests.openai.error = error.message;
        }

        // Test DynamoDB Table Names
        try {
            const tables = {
                users: await configService.getParameter('DYNAMODB_USERS_TABLE'),
                properties: await configService.getParameter('DYNAMODB_PROPERTIES_TABLE'),
                designs: await configService.getParameter('DYNAMODB_DESIGNS_TABLE'),
                captions: await configService.getParameter('DYNAMODB_CAPTIONS_TABLE')
            };
            testResults.tests.dynamodb.success = true;
            testResults.tests.dynamodb.tables = {
                usersTable: !!tables.users,
                propertiesTable: !!tables.properties,
                designsTable: !!tables.designs,
                captionsTable: !!tables.captions
            };
        } catch (error) {
            testResults.tests.dynamodb.error = error.message;
        }

        // Test AWS Credentials
        try {
            const credentials = await configService.getAwsCredentials();
            testResults.tests.aws.success = true;
            testResults.tests.aws.hasCredentials = !!(credentials.accessKeyId && credentials.secretAccessKey);
        } catch (error) {
            testResults.tests.aws.error = error.message;
        }

        res.status(200).json({
            status: 'success',
            message: 'Parameter Store test completed',
            results: testResults
        });
    } catch (error) {
        console.error('Parameter Store test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Parameter Store test failed',
            error: error.message
        });
    }
} 