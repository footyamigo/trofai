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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
    protocol: req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || 'http',
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
    
    // Determine the base URL for API requests
    let baseUrl = '';
    let useDirectS3Urls = false;
    let host = req.headers.host || '';
    
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_ENDPOINT) {
      baseUrl = process.env.NEXT_PUBLIC_API_ENDPOINT;
    } else {
      // In development mode, check if we're running locally
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      
      // If host includes localhost, use direct S3 URLs
      if (host && host.includes('localhost')) {
        useDirectS3Urls = true;
        console.log('Development environment detected with localhost - using direct S3 URLs');
      } else {
        baseUrl = `${protocol}://${host}`;
      }
    }

    console.log(`Using base URL: ${baseUrl}, Direct S3 URLs: ${useDirectS3Urls}`);
    
    // Get the referer hostname to check if we're being called from the same domain
    let refererHostname = null;
    try {
      if (req.headers.referer) {
        refererHostname = new URL(req.headers.referer).hostname;
      }
    } catch (e) {
      console.error('Error parsing referer:', e);
    }
    
    const templates = imageFiles.map((filename, index) => {
      let url;
      if (useDirectS3Urls) {
        // Use direct S3 URL
        url = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${folderName}/${filename}?t=${timestamp}`;
      } else {
        // Use our proxy API
        url = `${baseUrl}/api/s3-image-proxy?folder=${folderName}&file=${filename}&t=${timestamp}`;
      }
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
      requestInfo,
      isProduction: process.env.NODE_ENV === 'production',
      // Include URL generation info for debugging
      urlInfo: {
        protocol: requestInfo.protocol,
        host,
        refererHostname,
        usingAbsoluteUrls: process.env.NODE_ENV === 'production' || (baseUrl && refererHostname && !host.includes(refererHostname))
      }
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
      const protocol = req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || 
                      (req.headers.referer ? new URL(req.headers.referer).protocol.replace(':', '') : 'http');
      const host = req.headers['x-forwarded-host'] || req.headers['X-Forwarded-Host'] || req.headers.host || '';
      const baseUrl = host ? `${protocol}://${host}` : '';
      
      // Check if we're running in localhost and should use direct S3 URLs
      const useDirectS3Urls = host && host.includes('localhost');
      console.log(`Fallback using base URL: ${baseUrl}, Direct S3 URLs: ${useDirectS3Urls}`);
      
      // Fall back to placeholder images but keep the URL format consistent
      // with the rest of the logic (absolute URLs in production, relative in dev)
      const isProduction = process.env.NODE_ENV === 'production';
      const urlPrefix = isProduction && baseUrl ? baseUrl : '';
      
      const fallbackTemplates = [1, 2, 3].map(num => {
        let url;
        if (useDirectS3Urls) {
          // Use direct S3 URL with placeholder
          url = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${folderName}/design_${num}.png?t=${Date.now()}`;
        } else {
          // Use proxy API
          url = `${urlPrefix}/api/s3-image-proxy?folder=${folderName}&file=design_${num}.png&t=${Date.now()}`;
        }
        
        return { 
          filename: `design_${num}.png`, 
          name: `Design ${num}`, 
          url
        };
      });
      
      return res.status(200).json({
        folderName,
        templates: fallbackTemplates,
        isFallback: true,
        baseUrl,
        requestInfo,
        error: error.message,
        useDirectS3Urls
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