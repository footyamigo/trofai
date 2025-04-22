import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { formidable } from 'formidable';
import fs from 'fs';
import path from 'path';
import tables from '../../../src/aws/dynamoDbSchema'; // Adjust path if needed

// --- AWS Clients Initialization ---
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const S3_BUCKET_NAME = process.env.ASSETS_BUCKET_NAME; // Ensure this env var is set

// --- Authentication Helper (Modified to return full user item) ---
const getUserFromSession = async (session) => {
  if (!session) return null;
  try {
    const command = new QueryCommand({
      TableName: tables.users.tableName,
      IndexName: tables.users.indexes.bySession.indexName,
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session },
    });
    const response = await docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      return response.Items[0]; // Return the full user item
    }
  } catch (error) {
    console.error('Error validating session in DynamoDB:', error);
  }
  return null;
};

// --- API Handler Configuration ---
// Required for formidable to work with Next.js API routes
export const config = {
  api: {
    bodyParser: false, 
  },
};

// --- Main Handler ---
export default async function handler(req, res) {
  // 1. Authenticate User (Common for GET and POST)
  const session = req.headers.authorization?.replace('Bearer ', '');
  const user = await getUserFromSession(session);
  if (!user || !user.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid session' });
  }
  const userId = user.userId;
  console.log(`Agent Profile Request [${req.method}]: Authenticated user ${userId}`);

  // --- Handle GET Request --- 
  if (req.method === 'GET') {
    try {
      // User object already contains the data from the query
      const agentProfile = {
        agentName: user.agent_name || '',
        agentEmail: user.agent_email || user.email || '', // Fallback to user email
        agentPhone: user.agent_phone || '',
        agentPhotoUrl: user.agent_photo_url || null,
      };
      return res.status(200).json({ success: true, profile: agentProfile });
    } catch (error) {
      console.error('Error fetching agent profile [GET]:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch agent profile.' });
    }
  }

  // --- Handle POST Request --- 
  if (req.method === 'POST') {
    // 2. Parse Form Data
    const form = formidable({ multiples: false });

    try {
      await new Promise((resolve, reject) => {
        form.parse(req, async (err, fields, files) => {
          if (err) {
            console.error('Error parsing form data:', err);
            return reject(new Error('Failed to parse form data.'));
          }

          console.log('Form fields:', fields);
          console.log('Form files:', files);

          const agentName = fields.agentName?.[0];
          const agentEmail = fields.agentEmail?.[0];
          const agentPhone = fields.agentPhone?.[0];
          const agentPhotoFile = files.agentPhoto?.[0];

          // 3. Prepare DynamoDB Update
          const updateParams = {
            TableName: tables.users.tableName,
            Key: { userId: userId },
            UpdateExpression: 'SET updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':updatedAt': new Date().toISOString(),
            },
            ExpressionAttributeNames: {},
            ReturnValues: 'UPDATED_NEW',
          };

          const addUpdateParam = (dbField, value, attrName) => {
            if (value !== undefined && value !== null) {
              const valuePlaceholder = `:${dbField}`;
              updateParams.UpdateExpression += `, #${attrName} = ${valuePlaceholder}`;
              updateParams.ExpressionAttributeNames[`#${attrName}`] = dbField;
              updateParams.ExpressionAttributeValues[valuePlaceholder] = value;
            }
          };
          
          addUpdateParam('agent_name', agentName, 'agn');
          addUpdateParam('agent_email', agentEmail, 'age');
          addUpdateParam('agent_phone', agentPhone, 'agp');

          let photoUrl = null;

          // 4. Handle File Upload (if photo provided)
          if (agentPhotoFile) {
            console.log('Processing agent photo upload...');
            if (!S3_BUCKET_NAME) {
              throw new Error('S3 bucket name environment variable (ASSETS_BUCKET_NAME) is not configured.');
            }

            const fileExtension = path.extname(agentPhotoFile.originalFilename || 'unknown');
            const uniqueFilename = `${uuidv4()}${fileExtension}`;
            const s3Key = `agent-photos/${userId}/${uniqueFilename}`; 

            try {
              const fileStream = fs.createReadStream(agentPhotoFile.filepath);
              
              const s3Command = new PutObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
                Body: fileStream,
                ContentType: agentPhotoFile.mimetype,
                // ACL: 'public-read', // Uncomment if you want uploaded photos to be public by default
              });

              await s3Client.send(s3Command);
              
              // Construct the S3 URL (adjust if using CloudFront or custom domain)
              photoUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${s3Key}`;
              console.log(`Photo uploaded successfully: ${photoUrl}`);
              
              addUpdateParam('agent_photo_url', photoUrl, 'agph');

            } catch (s3Error) {
              console.error('Error uploading photo to S3:', s3Error);
              // Don't necessarily fail the whole request, maybe just log and continue without photo URL
              // return reject(new Error('Failed to upload profile photo.')); // Or handle more gracefully
            } finally {
               // Clean up temporary file created by formidable
               fs.unlink(agentPhotoFile.filepath, (unlinkErr) => {
                  if (unlinkErr) console.error("Error removing temp file:", unlinkErr);
               });
            }
          } else {
             console.log("No agent photo file provided in the form.");
          }

          // 5. Execute DynamoDB Update
          try {
            console.log('Executing DynamoDB update:', JSON.stringify(updateParams, null, 2));
            const updateResult = await docClient.send(new UpdateCommand(updateParams));
            console.log('DynamoDB update successful:', updateResult);
            resolve({ success: true, message: 'Agent profile updated successfully.', photoUrl }); // Resolve the promise
          } catch (dbError) {
            console.error('Error updating DynamoDB:', dbError);
            reject(new Error('Failed to save agent information to database.')); // Reject the promise
          }
        });
      })
      .then(result => {
          res.status(200).json(result);
      })
      .catch(error => {
          res.status(500).json({ success: false, message: error.message || 'Internal server error' });
      });

    } catch (error) {
      console.error('Unhandled error in agent profile API [POST]:', error);
      res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
    }
    return; // End POST request handling
  }

  // --- Handle other methods ---
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
} 