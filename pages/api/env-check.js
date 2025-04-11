import getConfig from 'next/config';

export default function handler(req, res) {
  const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

  // Check if key environment variables are set
  const envStatus = {
    firecrawl: {
      key: !!process.env.FIRECRAWL_API_KEY,
      configKey: !!serverRuntimeConfig.FIRECRAWL_API_KEY,
      useFirecrawl: process.env.USE_FIRECRAWL || serverRuntimeConfig.USE_FIRECRAWL
    },
    bannerbear: {
      key: !!process.env.BANNERBEAR_API_KEY,
      configKey: !!serverRuntimeConfig.BANNERBEAR_API_KEY,
      templateUid: !!serverRuntimeConfig.BANNERBEAR_TEMPLATE_UID,
      webhookUrl: !!serverRuntimeConfig.BANNERBEAR_WEBHOOK_URL
    },
    aws: {
      accessKey: !!process.env.ACCESS_KEY_ID,
      configAccessKey: !!serverRuntimeConfig.AWS_ACCESS_KEY_ID,
      region: process.env.REGION || serverRuntimeConfig.AWS_REGION,
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || serverRuntimeConfig.S3_BUCKET_NAME
    },
    nodeEnv: process.env.NODE_ENV,
    // List all available non-sensitive environment variables
    availableEnvVars: Object.keys(process.env)
      .filter(key => !key.includes('KEY') && !key.includes('SECRET'))
  };

  res.status(200).json({
    status: 'ok',
    environment: envStatus,
    publicConfig: publicRuntimeConfig
  });
} 