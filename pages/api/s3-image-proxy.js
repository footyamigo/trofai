import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';

// Get S3 configuration from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

// Log configuration on startup
console.log('S3 Image Proxy Config:', {
  bucketName: S3_BUCKET_NAME,
  region: S3_REGION,
  hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  environment: process.env.NODE_ENV
});

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Helper function to stream S3 content to response
async function streamToResponse(stream, res) {
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => res.write(chunk));
    stream.on('end', () => {
      res.end();
      resolve();
    });
    stream.on('error', (err) => {
      console.error("Error streaming response:", err);
      reject(err);
    });
  });
}

export default async function handler(req, res) {
  // Set comprehensive CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the path and folder parameters from the query string
  const { folder, file } = req.query;

  if (!folder || !file) {
    console.warn('Missing parameters:', { folder, file });
    return res.status(400).json({ message: 'Both folder and file parameters are required' });
  }

  // Construct the S3 key (path to the file in S3)
  const key = `${folder}/${file}`;
  
  // Log request details
  const requestInfo = {
    key,
    bucket: S3_BUCKET_NAME,
    requestHost: req.headers.host,
    referer: req.headers.referer || 'none',
    userAgent: req.headers['user-agent'] || 'none',
    timestamp: new Date().toISOString()
  };
  console.log('Image proxy request:', requestInfo);
  
  try {
    console.log(`Fetching S3 image: ${key} from bucket ${S3_BUCKET_NAME}`);

    // Check if we have the required AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('AWS credentials not configured - serving placeholder image');
      
      // Set CORS headers for the redirect
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Content-Type', 'image/png');
      
      // Return a placeholder image with the folder and file name
      res.redirect(`https://via.placeholder.com/300x200/FF5722/FFFFFF?text=${folder}+${file.split('.')[0]}`);
      return;
    }

    // Create the GetObject command to fetch the image from S3
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    // Send the command to S3
    const response = await s3Client.send(command);

    // Set appropriate headers based on content type and caching
    res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('ETag', response.ETag || `"${Date.now().toString()}"`);
    res.setHeader('Last-Modified', response.LastModified || new Date().toUTCString());
    
    // If the object has a body that's a Readable stream, pipe it to the response
    if (response.Body instanceof Readable) {
      await streamToResponse(response.Body, res);
      console.log(`Successfully streamed S3 image: ${key}`);
    } else {
      // For other body types (like Uint8Array), convert to a buffer and send
      const buffer = await response.Body.transformToByteArray();
      res.send(Buffer.from(buffer));
      console.log(`Successfully sent S3 image as buffer: ${key}`);
    }

  } catch (error) {
    console.error('Error fetching S3 image:', error.message);
    console.error('Error details:', {
      errorName: error.name,
      errorCode: error.code,
      errorStack: error.stack,
      requestKey: key,
      requestBucket: S3_BUCKET_NAME
    });
    
    // Set header for the redirect
    res.setHeader('Content-Type', 'image/png');
    
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      // Redirect to a placeholder image if the file doesn't exist
      console.log(`Image not found in S3: ${key} - serving placeholder`);
      res.redirect(`https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Not+Found:+${folder}+${file.split('.')[0]}`);
    } else {
      // For other errors, return a direct image response instead of a redirect
      // This avoids potential CORS issues with redirects
      console.log(`Error retrieving image from S3: ${error.message} - serving error placeholder`);
      
      // Instead of redirect, we could serve a local fallback image stored in the project
      // But redirecting to placeholder.com is simpler for now
      res.redirect(`https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Error:+${folder}+${file.split('.')[0]}`);
    }
  }
} 