/** @type {import('next').NextConfig} */

// Log environment variables at config load time
console.log('Loading next.config.js - Environment Variables Available:', 
  Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('KEY'))
    .join(', ')
);

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
  env: {
    // Server-side environment variables
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY,
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || process.env.NEXT_PUBLIC_USE_FIRECRAWL || 'true',
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY || process.env.NEXT_PUBLIC_BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID || process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID || process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    REGION: process.env.REGION || 'us-east-1',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'trofai',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  // Add build-time environment variable logging
  webpack: (config, { dev, isServer }) => {
    // Log environment variables at build time
    if (isServer) {
      console.log('Build-time environment check (Server):');
      console.log('FIRECRAWL_API_KEY:', process.env.FIRECRAWL_API_KEY ? 'Set' : 'Not set');
      console.log('BANNERBEAR_API_KEY:', process.env.BANNERBEAR_API_KEY ? 'Set' : 'Not set');
      console.log('ACCESS_KEY_ID:', process.env.ACCESS_KEY_ID ? 'Set' : 'Not set');
      console.log('REGION:', process.env.REGION || 'us-east-1');
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
    REGION: process.env.REGION,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    DYNAMODB_USERS_TABLE: process.env.DYNAMODB_USERS_TABLE,
    DYNAMODB_PROPERTIES_TABLE: process.env.DYNAMODB_PROPERTIES_TABLE,
    DYNAMODB_DESIGNS_TABLE: process.env.DYNAMODB_DESIGNS_TABLE,
    DYNAMODB_CAPTIONS_TABLE: process.env.DYNAMODB_CAPTIONS_TABLE,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    USE_FIRECRAWL: process.env.USE_FIRECRAWL,
    NODE_ENV: process.env.NODE_ENV,
    USE_FALLBACK: process.env.USE_FALLBACK,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
    NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET,
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT
  }
};

// Log the final config (excluding sensitive data)
console.log('Next.js Config Environment Variables:', {
  env: Object.keys(nextConfig.env),
  serverRuntime: Object.keys(nextConfig.serverRuntimeConfig),
  publicRuntime: nextConfig.publicRuntimeConfig
});

module.exports = nextConfig 