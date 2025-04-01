import getConfig from 'next/config';

export default function handler(req, res) {
  const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };
  
  // Get a safe version of the config (with masked keys)
  const safeConfig = {
    ROBORABBIT_API_KEY: serverRuntimeConfig.ROBORABBIT_API_KEY ? '✓ Set' : '✗ Missing',
    TASK_UID: serverRuntimeConfig.TASK_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_API_KEY: serverRuntimeConfig.BANNERBEAR_API_KEY ? '✓ Set' : '✗ Missing',
    BANNERBEAR_TEMPLATE_UID: serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_TEMPLATE_SET_UID: serverRuntimeConfig.BANNERBEAR_TEMPLATE_SET_UID ? '✓ Set' : '✗ Missing',
    BANNERBEAR_WEBHOOK_URL: serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL ? '✓ Set' : '✗ Missing',
    BANNERBEAR_WEBHOOK_SECRET: serverRuntimeConfig.BANNERBEAR_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing',
    AWS_ACCESS_KEY_ID: serverRuntimeConfig.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing',
    AWS_SECRET_ACCESS_KEY: serverRuntimeConfig.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing',
    AWS_REGION: serverRuntimeConfig.AWS_REGION,
    NODE_ENV: process.env.NODE_ENV
  };
  
  // Return the masked config
  res.status(200).json({ config: safeConfig });
} 