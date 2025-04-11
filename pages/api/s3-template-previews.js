// API route to fetch S3 template previews
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// S3 bucket name from environment variables
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

console.log('S3 Template Previews Config:', {
  bucket: S3_BUCKET_NAME,
  region: S3_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 4)}...` : 'undefined',
  environment: process.env.NODE_ENV
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
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the template set folder from the request
  const { folderName } = req.query;
  
  if (!folderName) {
    console.warn('Missing folderName parameter in request');
    return res.status(400).json({ message: 'Template folder name is required' });
  }
  
  const requestInfo = {
    folderName,
    requestHost: req.headers.host,
    referer: req.headers.referer || 'none',
    userAgent: req.headers['user-agent'] || 'none',
    protocol: req.headers['x-forwarded-proto'] || 'http',
    timestamp: new Date().toISOString()
  };
  console.log('Template previews request:', requestInfo);
  
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
    
    console.log(`Listing objects in ${S3_BUCKET_NAME}/${folderName}/`);
    
    // Execute the command to get list of objects in the folder
    const response = await s3Client.send(command);
    
    // Check if we got any files
    if (!response.Contents || response.Contents.length === 0) {
      console.warn(`No files found in ${folderName}`);
      return res.status(404).json({ 
        message: 'No files found in this template folder',
        folderName 
      });
    }
    
    console.log(`Found ${response.Contents.length} objects in ${folderName}`);
    
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
      console.warn(`No image files found in ${folderName}`);
      return res.status(404).json({ 
        message: 'No image files found in this template folder',
        folderName 
      });
    }
    
    console.log(`Found ${imageFiles.length} image files in ${folderName}`);
    
    // Format response with URLs that use our proxy API instead of direct S3 URLs
    const timestamp = Date.now(); // Add timestamp to prevent caching
    
    // Determine the correct base URL for the API
    let baseUrl = '';
    if (req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      baseUrl = `${protocol}://${req.headers.host}`;
    }
    
    const templates = imageFiles.map((filename, index) => {
      // Use absolute URLs with hostname when in production, relative URLs in development
      const isProduction = process.env.NODE_ENV === 'production';
      const url = isProduction && baseUrl 
        ? `${baseUrl}/api/s3-image-proxy?folder=${folderName}&file=${filename}&t=${timestamp}`
        : `/api/s3-image-proxy?folder=${folderName}&file=${filename}&t=${timestamp}`;
        
      console.log(`Generated URL for ${filename}: ${url}`);
      
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
      templates,
      baseUrl,
      requestInfo
    });
    
  } catch (error) {
    console.error('Error getting S3 template previews:', error.message);
    console.error('Error details:', {
      errorName: error.name,
      errorCode: error.code,
      errorStack: error.stack,
      folderName: folderName
    });
    
    // Provide fallback data for development/testing
    if (error.message.includes('AWS credentials') || error.code === 'CredentialsProviderError') {
      console.warn('Using fallback template previews due to missing AWS credentials');
      
      // Determine the correct base URL for the API
      let baseUrl = '';
      if (req.headers.host) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        baseUrl = `${protocol}://${req.headers.host}`;
      }
      
      // Fallback data for template sets using our proxy for better error handling
      const isProduction = process.env.NODE_ENV === 'production';
      const urlPrefix = isProduction && baseUrl ? baseUrl : '';
      
      const fallbackTemplates = [
        { filename: 'design_1.png', name: 'Design 1', url: `${urlPrefix}/api/s3-image-proxy?folder=${folderName}&file=design_1.png` },
        { filename: 'design_2.png', name: 'Design 2', url: `${urlPrefix}/api/s3-image-proxy?folder=${folderName}&file=design_2.png` },
        { filename: 'design_3.png', name: 'Design 3', url: `${urlPrefix}/api/s3-image-proxy?folder=${folderName}&file=design_3.png` }
      ];
      
      return res.status(200).json({
        folderName,
        templates: fallbackTemplates,
        isFallback: true,
        baseUrl,
        requestInfo
      });
    }
    
    return res.status(500).json({ 
      message: 'Error getting S3 template previews',
      error: error.message,
      errorDetails: {
        code: error.code,
        name: error.name
      }
    });
  }
} 