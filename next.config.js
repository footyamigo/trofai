/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'media.rightmove.co.uk',
      'images.bannerbear.com',
    ],
  },
  env: {
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    BANNERBEAR_WEBHOOK_SECRET: process.env.BANNERBEAR_WEBHOOK_SECRET,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
    TASK_UID: process.env.TASK_UID,
    BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'eu-west-2',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
  },
}

module.exports = nextConfig 