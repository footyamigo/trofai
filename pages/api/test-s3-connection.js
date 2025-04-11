import { S3Client, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  // Set CORS headers to allow client-side access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    console.log('Testing S3 connection with credentials');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 4)}...` : 'undefined');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present (hidden)' : 'undefined');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    // Step 1: Test general connectivity by listing buckets
    console.log('Step 1: Testing ListBuckets operation');
    const listBucketsCommand = new ListBucketsCommand({});
    const listBucketsResponse = await s3Client.send(listBucketsCommand);
    
    const buckets = listBucketsResponse.Buckets || [];
    console.log(`Found ${buckets.length} buckets`);
    
    // Step 2: Test specific bucket access by listing objects in the template folders
    console.log('Step 2: Testing ListObjectsV2 operation for specific bucket');
    const bucketName = process.env.S3_BUCKET_NAME || 'trofai';
    
    const folderPrefixes = [
      'templateset1/', 
      'templateset2/', 
      'templateset3/', 
      'templateset4/', 
      'templateset5/'
    ];
    
    const folderResults = [];
    
    // Test each template folder
    for (const prefix of folderPrefixes) {
      try {
        console.log(`Checking folder: ${prefix}`);
        const listObjectsCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          MaxKeys: 5
        });
        
        const listObjectsResponse = await s3Client.send(listObjectsCommand);
        const objectCount = listObjectsResponse.Contents?.length || 0;
        
        console.log(`Found ${objectCount} objects in ${prefix}`);
        
        folderResults.push({
          folder: prefix,
          objectCount,
          success: true,
          firstFewObjects: (listObjectsResponse.Contents || [])
            .slice(0, 3)
            .map(item => ({ key: item.Key, size: item.Size }))
        });
      } catch (folderError) {
        console.error(`Error checking folder ${prefix}:`, folderError);
        folderResults.push({
          folder: prefix,
          success: false,
          error: folderError.message,
          code: folderError.code
        });
      }
    }
    
    // Return comprehensive test results
    return res.status(200).json({
      success: true,
      environment: process.env.NODE_ENV,
      s3Connection: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucketConfigured: !!process.env.S3_BUCKET_NAME,
        bucketName: bucketName,
        bucketsFound: buckets.length,
        credentialsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      },
      folderResults
    });
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 