import getConfig from 'next/config'

export default function handler(req, res) {
  const { serverRuntimeConfig, publicRuntimeConfig } = getConfig()

  // Only return non-sensitive information
  const safeServerConfig = {
    USE_FIRECRAWL: serverRuntimeConfig.USE_FIRECRAWL,
    AWS_REGION: serverRuntimeConfig.AWS_REGION,
    S3_BUCKET_NAME: serverRuntimeConfig.S3_BUCKET_NAME,
    // Add flags to indicate if sensitive variables are set
    hasFirecrawlKey: !!serverRuntimeConfig.FIRECRAWL_API_KEY,
    hasBannerbearKey: !!serverRuntimeConfig.BANNERBEAR_API_KEY,
    hasAwsAccessKey: !!serverRuntimeConfig.AWS_ACCESS_KEY_ID,
    hasAwsSecretKey: !!serverRuntimeConfig.AWS_SECRET_ACCESS_KEY,
    hasOpenAIKey: !!serverRuntimeConfig.OPENAI_API_KEY,
  }

  res.status(200).json({
    serverConfig: safeServerConfig,
    publicConfig: publicRuntimeConfig,
    nodeEnv: process.env.NODE_ENV,
  })
} 