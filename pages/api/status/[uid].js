import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  }
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'trofai-image-status';

async function getStatusFromDynamo(uid) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { uid }
    };

    const result = await dynamoDB.get(params).promise();
    console.log('Successfully retrieved status from DynamoDB:', uid);
    return result.Item;
  } catch (error) {
    console.error('Error getting status from DynamoDB:', error);
    return null; // Return null instead of throwing to enable fallback
  }
}

// Fallback function to check Bannerbear directly
async function getStatusFromBannerbear(uid, isCollection = false) {
  try {
    const apiUrl = isCollection 
      ? `https://api.bannerbear.com/v2/collections/${uid}`
      : `https://api.bannerbear.com/v2/images/${uid}?project_id=E56OLrMKYWnzwl3oQj`;
    
    console.log(`Checking Bannerbear status directly for ${isCollection ? 'collection' : 'image'} ${uid}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Bannerbear API Error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Bannerbear direct status check result:', data);
    
    return {
      uid: data.uid,
      status: data.status,
      type: isCollection ? 'collection' : 'image',
      image_url: data.image_url,
      image_url_png: data.image_url_png,
      image_url_jpg: data.image_url_jpg,
      created_at: data.created_at,
      updated_at: data.updated_at,
      image_urls: data.image_urls
    };
  } catch (error) {
    console.error('Error checking Bannerbear directly:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid } = req.query;
  const { type } = req.query; // Optional: 'collection' or 'image'
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  try {
    // First try DynamoDB
    let status = await getStatusFromDynamo(uid);
    
    // If not found or incomplete, try direct Bannerbear API
    if (!status || !status.status) {
      console.log('No status found in DynamoDB, checking Bannerbear directly');
      
      // Try collection first, then image if not found
      status = await getStatusFromBannerbear(uid, type === 'collection' || !type);
      
      if (!status && !type) {
        console.log('Not found as collection, trying as image');
        status = await getStatusFromBannerbear(uid, false);
      }
    }

    if (!status) {
      return res.status(404).json({ 
        message: 'Status not found',
        fallback: {
          uid,
          status: 'unknown',
          type: type || 'unknown'
        }
      });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      fallback: {
        uid,
        status: 'error',
        type: type || 'unknown'
      }
    });
  }
} 