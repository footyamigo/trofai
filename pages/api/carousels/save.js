import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
// import { getDb } from '../../utils/db'; // Placeholder for your DB connection utility
// import { ObjectId } from 'mongodb'; // Or your specific DB ID type

const region = process.env.REGION || 'us-east-1'; // Use REGION from .env

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID, // Use ACCESS_KEY_ID from .env
    secretAccessKey: process.env.SECRET_ACCESS_KEY, // Use SECRET_ACCESS_KEY from .env
  },
});

const dynamoDbClient = new DynamoDBClient({
  region: region,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID, // Use ACCESS_KEY_ID from .env
    secretAccessKey: process.env.SECRET_ACCESS_KEY, // Use SECRET_ACCESS_KEY from .env
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);
const CAROUSELS_TABLE_NAME = process.env.DYNAMODB_CAROUSELS_TABLE || 'trofai-carousels'; // Updated table name
const USERS_TABLE_NAME = 'trofai-users'; // As seen in other API routes
const SESSION_INDEX_NAME = 'SessionIndex'; // As seen in other API routes

// Use NEXT_PUBLIC_S3_BUCKET from .env, fallback to a default if not set (though it should be)
const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET || 'trofai'; 

// Helper to extract Bearer token from Authorization header
const getSessionTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer '
  }
  return null;
};

async function getUserIdFromSessionToken(sessionToken) {
  if (!sessionToken) {
    return null;
  }
  try {
    const queryCommand = new QueryCommand({
      TableName: USERS_TABLE_NAME,
      IndexName: SESSION_INDEX_NAME,
      KeyConditionExpression: '#sessionAttr = :sessionVal', // Use placeholder for attribute name
      ExpressionAttributeNames: {
        '#sessionAttr': 'session', // Actual attribute name for the session token in GSI
      },
      ExpressionAttributeValues: {
        ':sessionVal': sessionToken,
      },
    });
    const { Items } = await docClient.send(queryCommand);
    if (Items && Items.length > 0) {
      return Items[0].userId; // Assuming the user item has a 'userId' attribute
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by session token:', error);
    return null;
  }
}

async function uploadImageToS3(imageDataUrl, userId, carouselId, slideIndex) {
  const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const uniqueFilename = `${uuidv4()}.png`;
  // Updated S3 key to reflect the desired path: s3://trofai/carousels/USER_ID/CAROUSEL_ID/FILENAME.png
  const s3Key = `carousels/${userId}/${carouselId}/slide-${slideIndex}-${uniqueFilename}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: 'image/png',
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    const imageUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3.');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const sessionToken = getSessionTokenFromHeader(req);
  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing session token.' });
  }

  const userId = await getUserIdFromSessionToken(sessionToken);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session token.' });
  }

  const {
    slides: slidesWithDataUrl,
    mainTitle,
    globalCaption,
    contentTheme,
    city,
    audienceAppeal,
    toneStyle,
    colorPalette,
    backgroundDesign,
    fontPairing,
  } = req.body;

  if (!slidesWithDataUrl || !Array.isArray(slidesWithDataUrl) || slidesWithDataUrl.length === 0) {
    return res.status(400).json({ success: false, message: 'Slides data is required.' });
  }
  if (!mainTitle || !globalCaption) {
    return res.status(400).json({ success: false, message: 'Main title and global caption are required.' });
  }

  const carouselId = uuidv4();
  const createdAt = new Date().toISOString();

  try {
    const processedSlides = [];
    for (let i = 0; i < slidesWithDataUrl.length; i++) {
      const slide = slidesWithDataUrl[i];
      // Ensure slide.imageUrl is present and is a data URL
      if (!slide.imageUrl || !slide.imageUrl.startsWith('data:image/png;base64,')) {
        console.error(`Invalid imageDataUrl for slide ${i}:`, slide.imageUrl);
        // Skip this slide or throw an error, depending on desired behavior
        // For now, we'll throw an error to ensure data integrity for saving.
        throw new Error(`Invalid image data for slide ${i + 1}.`); 
      }
      const s3ImageUrl = await uploadImageToS3(slide.imageUrl, userId, carouselId, i);
      // Clean slide object to remove undefined values
      const cleanedSlide = {};
      if (slide.heading !== undefined) cleanedSlide.heading = slide.heading;
      if (slide.paragraph !== undefined) cleanedSlide.paragraph = slide.paragraph;
      cleanedSlide.s3ImageUrl = s3ImageUrl;
      cleanedSlide.originalIndex = i;
      processedSlides.push(cleanedSlide);
    }

    const carouselToSave = {
      id: carouselId, // Using 'id' as a common primary key name for DynamoDB
      userId, // Now the authenticated user's ID
      mainTitle,
      globalCaption,
      contentTheme: contentTheme || null,
      city: city || null,
      audienceAppeal: audienceAppeal || null,
      toneStyle: toneStyle || null,
      colorPalette: colorPalette || null, // Ensure colorPalette is an object
      backgroundDesign: backgroundDesign || null,
      fontPairing: fontPairing || null, // Ensure fontPairing is an object
      slides: processedSlides,
      createdAt: createdAt,
      updatedAt: createdAt, // Set to createdAt initially
    };

    const putCommand = new PutCommand({
      TableName: CAROUSELS_TABLE_NAME,
      Item: carouselToSave,
    });

    await docClient.send(putCommand);

    return res.status(201).json({ 
      success: true, 
      message: 'Carousel saved successfully.', 
      carouselId: carouselId, 
      savedCarousel: carouselToSave // Return the full saved data, including slides with s3ImageUrls
    });

  } catch (error) {
    console.error('Error saving carousel:', error);
    // If it's an error from uploadImageToS3, it might already be specific
    // Otherwise, provide a generic message.
    const errorMessage = error.message.includes('S3') || error.message.includes('image data') 
                         ? error.message 
                         : 'Failed to save carousel to database.';
    return res.status(500).json({ success: false, message: errorMessage });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 