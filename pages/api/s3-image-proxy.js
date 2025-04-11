import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';

// Get S3 configuration from environment variables
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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the path and folder parameters from the query string
  const { folder, file } = req.query;

  if (!folder || !file) {
    return res.status(400).json({ message: 'Both folder and file parameters are required' });
  }

  // Construct the S3 key (path to the file in S3)
  const key = `${folder}/${file}`;
  
  try {
    console.log(`Fetching S3 image: ${key} from bucket ${S3_BUCKET_NAME}`);

    // Check if we have the required AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('AWS credentials not configured - serving placeholder image');
      
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
    
    // If the object has a body that's a Readable stream, pipe it to the response
    if (response.Body instanceof Readable) {
      await streamToResponse(response.Body, res);
    } else {
      // For other body types (like Uint8Array), convert to a buffer and send
      const buffer = await response.Body.transformToByteArray();
      res.send(Buffer.from(buffer));
    }

  } catch (error) {
    console.error('Error fetching S3 image:', error);
    
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      // Redirect to a placeholder image if the file doesn't exist
      res.redirect(`https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Not+Found:+${folder}+${file.split('.')[0]}`);
    } else {
      // For other errors, return an error response or a placeholder
      res.redirect(`https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Error:+${folder}+${file.split('.')[0]}`);
    }
  }
} 