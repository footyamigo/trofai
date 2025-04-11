// Debug endpoint to check template URLs and configurations
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// S3 bucket name from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

// Configure AWS S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const debugInfo = {
    requestInfo: {
      host: req.headers.host,
      referer: req.headers.referer || 'none',
      userAgent: req.headers['user-agent'],
      forwardedProto: req.headers['x-forwarded-proto'],
      forwardedHost: req.headers['x-forwarded-host'],
      forwardedFor: req.headers['x-forwarded-for'],
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      s3Bucket: S3_BUCKET_NAME,
      s3Region: S3_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    },
    templateFolders: ["templateset1", "templateset2", "templateset3", "templateset4", "templateset5"],
    urlGeneration: {}
  };

  // Generate both kinds of URLs for each template folder
  for (const folder of debugInfo.templateFolders) {
    try {
      // List objects in this folder
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: `${folder}/`,
        MaxKeys: 2
      });
      
      const response = await s3Client.send(command);
      
      // Find image files
      const imageFiles = response.Contents
        ?.filter(item => 
          item.Key !== `${folder}/` && 
          (item.Key.endsWith('.png') || 
          item.Key.endsWith('.jpg') || 
          item.Key.endsWith('.jpeg') || 
          item.Key.endsWith('.gif')))
        .map(item => item.Key.split('/').pop()) || [];
          
      const timestamp = Date.now();
      
      // Generate sample URLs for this folder (both relative and absolute)
      if (imageFiles.length > 0) {
        const sampleFile = imageFiles[0];
        
        // Compute different base URL formats
        const host = req.headers.host || '';
        const proto = req.headers['x-forwarded-proto'] || 'http';
        
        debugInfo.urlGeneration[folder] = {
          fileFound: sampleFile,
          totalFiles: imageFiles.length,
          urlVariations: {
            relativeUrl: `/api/s3-image-proxy?folder=${folder}&file=${sampleFile}&t=${timestamp}`,
            absoluteUrl1: `${proto}://${host}/api/s3-image-proxy?folder=${folder}&file=${sampleFile}&t=${timestamp}`,
            absoluteUrl2: host ? `https://${host}/api/s3-image-proxy?folder=${folder}&file=${sampleFile}&t=${timestamp}` : null,
            absoluteUrl3: host ? `http://${host}/api/s3-image-proxy?folder=${folder}&file=${sampleFile}&t=${timestamp}` : null,
          },
          directTest: {
            imageUrl: `/api/s3-image-proxy?folder=${folder}&file=${sampleFile}`,
            directS3Url: `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${folder}/${sampleFile}`
          }
        };
      } else {
        debugInfo.urlGeneration[folder] = {
          error: "No image files found in this folder",
          rawListing: response.Contents?.map(item => item.Key) || []
        };
      }
    } catch (error) {
      debugInfo.urlGeneration[folder] = {
        error: error.message,
        errorCode: error.code,
        errorName: error.name
      };
    }
  }

  // Add HTML for live testing of URLs
  let htmlOutput = `
    <html>
      <head>
        <title>Template URL Debug</title>
        <style>
          body { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          .test-section { margin-bottom: 40px; border: 1px solid #ccc; padding: 15px; border-radius: 8px; }
          h2 { margin-top: 0; }
          .url-test { margin-bottom: 20px; }
          .url { font-family: monospace; background: #f4f4f4; padding: 5px; margin: 5px 0; word-break: break-all; }
          img { max-width: 300px; border: 1px solid #eee; }
          .error { color: red; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <h1>Template URL Debug</h1>
  `;

  // Add sections for each template folder
  for (const folder in debugInfo.urlGeneration) {
    const folderData = debugInfo.urlGeneration[folder];
    
    htmlOutput += `
      <div class="test-section">
        <h2>Template Set: ${folder}</h2>
    `;
    
    if (folderData.error) {
      htmlOutput += `<p class="error">Error: ${folderData.error}</p>`;
    } else {
      htmlOutput += `
        <p>File found: ${folderData.fileFound} (${folderData.totalFiles} total images)</p>
        
        <div class="url-test">
          <h3>Relative URL</h3>
          <div class="url">${folderData.urlVariations.relativeUrl}</div>
          <img src="${folderData.urlVariations.relativeUrl}" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Load+Failed';this.classList.add('error')" />
        </div>
        
        <div class="url-test">
          <h3>Absolute URL (${req.headers['x-forwarded-proto'] || 'http'})</h3>
          <div class="url">${folderData.urlVariations.absoluteUrl1}</div>
          <img src="${folderData.urlVariations.absoluteUrl1}" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Load+Failed';this.classList.add('error')" />
        </div>
        
        <div class="url-test">
          <h3>Direct Image Test</h3>
          <div class="url">${folderData.directTest.imageUrl}</div>
          <img src="${folderData.directTest.imageUrl}" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Load+Failed';this.classList.add('error')" />
        </div>
      `;
    }
    
    htmlOutput += `</div>`;
  }
  
  // Add the raw debug info as well
  htmlOutput += `
        <div class="test-section">
          <h2>Raw Debug Info</h2>
          <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </body>
    </html>
  `;

  // Determine if the client wants HTML or JSON
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/html')) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlOutput);
  } else {
    res.status(200).json(debugInfo);
  }
} 