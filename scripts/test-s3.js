require('dotenv').config({ path: '.env.local' });
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

// S3 bucket and region
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "trofai";
const S3_REGION = process.env.AWS_REGION || "us-east-1";

console.log('Testing S3 connection with:');
console.log(`- Bucket: ${S3_BUCKET_NAME}`);
console.log(`- Region: ${S3_REGION}`);
console.log(`- Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 5) + '...' : 'undefined'}`);
console.log(`- Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'defined (hidden)' : 'undefined'}`);

// Create S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Function to test listing objects in a folder
async function testListObjects(folderName) {
  try {
    console.log(`\nListing objects in folder: ${folderName}/`);
    
    // Set up S3 list objects command
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: `${folderName}/`,
      MaxKeys: 20
    });
    
    // Execute the command
    const response = await s3Client.send(command);
    
    // Check if we got any files
    if (!response.Contents || response.Contents.length === 0) {
      console.log(`No files found in ${folderName}/`);
      return;
    }
    
    // Log the files
    console.log(`Found ${response.Contents.length} objects:`);
    response.Contents.forEach((item, index) => {
      console.log(`${index + 1}. ${item.Key} (${item.Size} bytes)`);
    });
    
    // Filter image files
    const imageFiles = response.Contents
      .filter(item => 
        item.Key !== `${folderName}/` && 
        (item.Key.endsWith('.png') || 
         item.Key.endsWith('.jpg') || 
         item.Key.endsWith('.jpeg') || 
         item.Key.endsWith('.gif'))
      )
      .map(item => item.Key);
    
    console.log(`\nFound ${imageFiles.length} image files:`);
    imageFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
      console.log(`   URL: https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${file}`);
    });
    
  } catch (error) {
    console.error(`Error listing objects in ${folderName}/`, error);
  }
}

// Test listing objects in the root of the bucket
async function testListRootObjects() {
  try {
    console.log('\nListing objects in bucket root:');
    
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 10
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('No files found in bucket root');
      return;
    }
    
    console.log(`Found ${response.Contents.length} objects:`);
    response.Contents.forEach((item, index) => {
      console.log(`${index + 1}. ${item.Key} (${item.Size} bytes)`);
    });
    
  } catch (error) {
    console.error('Error listing objects in bucket root:', error);
  }
}

// Execute the tests
async function runTests() {
  try {
    // First test - list root objects
    await testListRootObjects();
    
    // Test specific folders
    await testListObjects('templateset1');
    
    console.log('\nS3 tests completed successfully');
  } catch (error) {
    console.error('Error running S3 tests:', error);
  }
}

runTests(); 