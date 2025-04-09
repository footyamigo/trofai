import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Default bucket name
const defaultBucket = process.env.NEXT_PUBLIC_S3_BUCKET;

// S3 folder structure
const S3_FOLDERS = {
  PROPERTY_IMAGES: 'property-images/',
  DESIGN_IMAGES: 'design-images/',
  USER_UPLOADS: 'user-uploads/',
  PROFILE_PICTURES: 'profile-pictures/',
};

export const s3 = {
  /**
   * Upload a file to S3
   * @param {File|Blob|Buffer} file - The file to upload
   * @param {string} folder - The folder to upload to (use S3_FOLDERS constant)
   * @param {string} [fileName] - Optional custom filename, defaults to UUID
   * @param {string} [contentType] - Optional content type
   * @param {Object} [metadata] - Optional metadata
   * @returns {Promise<{key: string, url: string}>} - The S3 key and URL
   */
  uploadFile: async (file, folder, fileName, contentType, metadata = {}) => {
    // Generate a unique filename if not provided
    const key = folder + (fileName || `${uuidv4()}.${getFileExtension(file)}`);
    
    // Convert File/Blob to buffer if needed
    let fileBody = file;
    if (file instanceof Blob || file instanceof File) {
      fileBody = await file.arrayBuffer();
    }

    // Determine content type if not provided
    let detectedContentType = contentType;
    if (!detectedContentType && file.type) {
      detectedContentType = file.type;
    }

    // Upload to S3
    const params = {
      Bucket: defaultBucket,
      Key: key,
      Body: fileBody,
      ContentType: detectedContentType,
      Metadata: metadata,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Return the key and URL
    return {
      key,
      url: `https://${defaultBucket}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`,
    };
  },

  /**
   * Get a file from S3
   * @param {string} key - The S3 key of the file
   * @returns {Promise<Blob>} - The file as a Blob
   */
  getFile: async (key) => {
    const params = {
      Bucket: defaultBucket,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Convert stream to blob
    const blob = await streamToBlob(response.Body, response.ContentType);
    return blob;
  },

  /**
   * Delete a file from S3
   * @param {string} key - The S3 key of the file
   * @returns {Promise<void>}
   */
  deleteFile: async (key) => {
    const params = {
      Bucket: defaultBucket,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  },

  /**
   * Generate a signed URL for an S3 object
   * @param {string} key - The S3 key of the file
   * @param {number} [expiresIn=3600] - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - The signed URL
   */
  getSignedUrl: async (key, expiresIn = 3600) => {
    const params = {
      Bucket: defaultBucket,
      Key: key,
      Expires: expiresIn,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  },

  // Export the folder structure
  folders: S3_FOLDERS,
};

// Helper function to get file extension
function getFileExtension(file) {
  if (typeof file === 'string') {
    return file.split('.').pop();
  }
  
  if (file.name) {
    return file.name.split('.').pop();
  }
  
  // Default to jpg if no extension can be determined
  return 'jpg';
}

// Helper function to convert stream to blob
async function streamToBlob(stream, contentType) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return new Blob(chunks, { type: contentType });
}

export default s3; 