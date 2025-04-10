/** @type {import('next').NextConfig} */
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
  // Log environment variables during build
  onBuildStart: () => {
    console.log('Build-time environment variables:');
    console.log('ACCESS_KEY_ID:', process.env.ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('BANNERBEAR_API_KEY:', process.env.BANNERBEAR_API_KEY ? 'Set' : 'Not set');
    console.log('FIRECRAWL_API_KEY:', process.env.FIRECRAWL_API_KEY ? 'Set' : 'Not set');
    console.log('REGION:', process.env.REGION ? 'Set' : 'Not set');
  },
  env: {
    FIRECRAWL_API_KEY: process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY,
    USE_FIRECRAWL: process.env.NEXT_PUBLIC_USE_FIRECRAWL || process.env.USE_FIRECRAWL || 'true',
    BANNERBEAR_API_KEY: process.env.NEXT_PUBLIC_BANNERBEAR_API_KEY || process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_UID || process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID || process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY,
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || process.env.NEXT_PUBLIC_USE_FIRECRAWL || 'true',
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY || process.env.NEXT_PUBLIC_BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID || process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID || process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
    AWS_ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
    AWS_REGION: process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET || 'trofai-assets',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    BANNERBEAR_TEMPLATE_UID: process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_UID || process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.NEXT_PUBLIC_BANNERBEAR_TEMPLATE_SET_UID || process.env.BANNERBEAR_TEMPLATE_SET_UID,
    S3_REGION: process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET || 'trofai-assets',
    USE_FIRECRAWL: process.env.NEXT_PUBLIC_USE_FIRECRAWL || process.env.USE_FIRECRAWL || 'true',
  },
}

// Log all available environment variables at build time
console.log('Available environment variables at config time:');
Object.keys(process.env).forEach(key => {
  if (!key.includes('SECRET') && !key.includes('KEY')) {
    console.log(`${key}: ${process.env[key]}`);
  } else {
    console.log(`${key}: [HIDDEN]`);
  }
});

module.exports = nextConfig 