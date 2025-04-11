import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

// S3 bucket name from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

export default async function handler(req, res) {
  // Set CORS headers for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the folder for testing from query
  const { folder = 'templateset1' } = req.query;

  const results = {
    environmentCheck: {
      nodeEnv: process.env.NODE_ENV,
      s3Bucket: S3_BUCKET_NAME,
      s3Region: S3_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) : null,
    },
    apiUrl: req.headers.host ? `https://${req.headers.host}` : 'unknown',
    requestHeaders: {
      origin: req.headers.origin || 'none',
      referer: req.headers.referer || 'none'
    },
    s3Tests: {},
    imageProxyTest: {}
  };

  try {
    // Test 1: List objects in the template folder
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: `${folder}/`,
      MaxKeys: 5
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    results.s3Tests.listObjects = {
      success: true,
      folderTested: folder,
      objectsFound: listResponse.Contents ? listResponse.Contents.length : 0,
      objectKeys: listResponse.Contents ? listResponse.Contents.map(item => item.Key) : []
    };

    // Test 2: Try to get a specific image if we found any
    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const firstImageKey = listResponse.Contents.find(item => 
        item.Key.endsWith('.png') || 
        item.Key.endsWith('.jpg') || 
        item.Key.endsWith('.jpeg')
      )?.Key;

      if (firstImageKey) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: firstImageKey
          });
          
          const getResponse = await s3Client.send(getCommand);
          
          results.s3Tests.getObject = {
            success: true,
            objectTested: firstImageKey,
            contentType: getResponse.ContentType,
            contentLength: getResponse.ContentLength,
          };
          
          // Test 3: Generate image proxy URL for this image
          const filename = firstImageKey.split('/').pop();
          const imageProxyUrl = `/api/s3-image-proxy?folder=${folder}&file=${filename}`;
          
          results.imageProxyTest = {
            imageKey: firstImageKey,
            proxyUrl: imageProxyUrl,
            absoluteProxyUrl: req.headers.host ? `https://${req.headers.host}${imageProxyUrl}` : 'unknown',
            instruction: "Try accessing this URL in your browser to test the image proxy directly"
          };
          
        } catch (getError) {
          results.s3Tests.getObject = {
            success: false,
            objectTested: firstImageKey,
            error: getError.message,
            errorCode: getError.code
          };
        }
      }
    }
    
  } catch (error) {
    results.s3Tests.listObjects = {
      success: false,
      error: error.message,
      errorCode: error.code,
      errorStack: error.stack
    };
  }

  // Return the diagnostic results
  return res.status(200).json(results);
} 