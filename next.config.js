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
  env: {
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || 'true',
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || 'true',
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    BANNERBEAR_WEBHOOK_URL: process.env.BANNERBEAR_WEBHOOK_URL,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'trofai',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
    S3_REGION: process.env.AWS_REGION || 'us-east-1',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'trofai',
    USE_FIRECRAWL: process.env.USE_FIRECRAWL || 'true',
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
  },
}

module.exports = nextConfig 