// API route to fetch S3 template previews
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// S3 bucket name from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

console.log('S3 API Config:', {
  bucket: S3_BUCKET_NAME,
  region: S3_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 4)}...` : 'undefined'
});

// Configure AWS S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the template set folder from the request
  const { folderName } = req.query;
  
  if (!folderName) {
    return res.status(400).json({ message: 'Template folder name is required' });
  }
  
  try {
    // Check if we have the required AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }
    
    // Set up S3 list objects command
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: `${folderName}/`,
      MaxKeys: 20
    });
    
    // Execute the command to get list of objects in the folder
    const response = await s3Client.send(command);
    
    // Check if we got any files
    if (!response.Contents || response.Contents.length === 0) {
      return res.status(404).json({ 
        message: 'No files found in this template folder',
        folderName 
      });
    }
    
    // Filter for image files and exclude the folder itself
    const imageFiles = response.Contents
      .filter(item => 
        item.Key !== `${folderName}/` && 
        (item.Key.endsWith('.png') || 
         item.Key.endsWith('.jpg') || 
         item.Key.endsWith('.jpeg') || 
         item.Key.endsWith('.gif'))
      )
      .map(item => item.Key.split('/').pop());
    
    if (imageFiles.length === 0) {
      return res.status(404).json({ 
        message: 'No image files found in this template folder',
        folderName 
      });
    }
    
    // Format response with URLs that use our proxy API instead of direct S3 URLs
    const timestamp = Date.now(); // Add timestamp to prevent caching
    const templates = imageFiles.map((filename, index) => {
      // Use our proxy API for S3 images
      const url = `/api/s3-image-proxy?folder=${folderName}&file=${filename}&t=${timestamp}`;
      console.log(`Generated proxied URL for ${filename}: ${url}`);
      return {
        filename,
        name: `Design ${index + 1}`,
        url
      };
    });
    
    console.log(`Returning ${templates.length} template previews for ${folderName}`);
    
    // Return the file information
    return res.status(200).json({
      folderName,
      templates
    });
    
  } catch (error) {
    console.error('Error getting S3 template previews:', error);
    
    // Provide fallback data for development/testing
    if (error.message.includes('AWS credentials') || error.code === 'CredentialsProviderError') {
      console.warn('Using fallback template previews due to missing AWS credentials');
      
      // Fallback data for template sets using our proxy for better error handling
      const fallbackTemplates = [
        { filename: 'design_1.png', name: 'Design 1', url: `/api/s3-image-proxy?folder=${folderName}&file=design_1.png` },
        { filename: 'design_2.png', name: 'Design 2', url: `/api/s3-image-proxy?folder=${folderName}&file=design_2.png` },
        { filename: 'design_3.png', name: 'Design 3', url: `/api/s3-image-proxy?folder=${folderName}&file=design_3.png` }
      ];
      
      return res.status(200).json({
        folderName,
        templates: fallbackTemplates,
        isFallback: true
      });
    }
    
    return res.status(500).json({ 
      message: 'Error getting S3 template previews',
      error: error.message 
    });
  }
} 