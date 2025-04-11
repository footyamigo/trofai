/** @type {import('next').NextConfig} */

// Log environment variables at config load time
console.log('Loading next.config.js - Environment Variables Available:', 
  Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('KEY'))
    .join(', ')
);

// Determine the API endpoint based on environment
const getApiEndpoint = () => {
  if (process.env.NEXT_PUBLIC_API_ENDPOINT) {
    return process.env.NEXT_PUBLIC_API_ENDPOINT;
  }
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api';
  }
  // In production, use the same domain as the app
  return '/api';
};

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'media.rightmove.co.uk',
      'images.bannerbear.com',
      'trofai.s3.us-east-1.amazonaws.com',
      'trofai.s3.amazonaws.com',
      'photos.zillowstatic.com',
      'www.zillowstatic.com',
    ],
  },
  // Add build-time environment variable logging
  webpack: (config, { dev, isServer }) => {
    // Log environment variables at build time
    if (isServer) {
      console.log('Build-time environment check (Server):');
      const envVars = [
        'FIRECRAWL_API_KEY',
        'BANNERBEAR_API_KEY',
        'ACCESS_KEY_ID',
        'SECRET_ACCESS_KEY',
        'REGION',
        'S3_BUCKET_NAME',
        'NEXT_PUBLIC_AWS_REGION',
        'NEXT_PUBLIC_S3_BUCKET'
      ];
      
      envVars.forEach(key => {
        if (!process.env[key]) {
          console.warn(`Warning: ${key} is not set`);
        }
      });

      // Log the determined API endpoint
      console.log('API Endpoint:', getApiEndpoint());
    }
    return config;
  },
  // Explicitly set runtime configs
  serverRuntimeConfig: {
    // Will only be available on the server side
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_PROJECT_ID: process.env.BANNERBEAR_PROJECT_ID,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    REGION: process.env.REGION || 'us-east-1',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    DYNAMODB_USERS_TABLE: process.env.DYNAMODB_USERS_TABLE || 'trofai-users',
    DYNAMODB_PROPERTIES_TABLE: process.env.DYNAMODB_PROPERTIES_TABLE || 'trofai-properties',
    DYNAMODB_DESIGNS_TABLE: process.env.DYNAMODB_DESIGNS_TABLE || 'trofai-designs',
    DYNAMODB_CAPTIONS_TABLE: process.env.DYNAMODB_CAPTIONS_TABLE || 'trofai-captions',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || process.env.NEXT_PUBLIC_S3_BUCKET || 'trofai'
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || 'true',
    NODE_ENV: process.env.NODE_ENV || 'production',
    USE_FALLBACK: process.env.USE_FALLBACK || 'false',
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || process.env.REGION || 'us-east-1',
    NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
    NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || 'trofai-assets',
    NEXT_PUBLIC_API_ENDPOINT: getApiEndpoint()
  }
};

// Log the final config (excluding sensitive data)
console.log('Next.js Config Environment Variables:', {
  serverRuntime: Object.keys(nextConfig.serverRuntimeConfig),
  publicRuntime: nextConfig.publicRuntimeConfig
});

module.exports = nextConfig 