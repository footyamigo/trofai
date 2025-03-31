import AWS from 'aws-sdk';

// Configure AWS
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const AWS_REGION = process.env.REGION || 'us-east-1';
const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;

// Configure AWS with error handling
let dynamoDB;
try {
  AWS.config.update({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  });

  dynamoDB = new AWS.DynamoDB.DocumentClient();
  console.log('Status API: DynamoDB configured successfully');
} catch (error) {
  console.error('Status API: Failed to configure AWS:', error);
}

const TABLE_NAME = 'trofai-image-status';

async function getStatusFromDynamo(uid) {
  if (!dynamoDB) {
    console.log('DynamoDB not configured, skipping DB lookup');
    return null;
  }
  
  try {
    console.log('Getting status from DynamoDB:', uid);
    const params = {
      TableName: TABLE_NAME,
      Key: { uid }
    };
    
    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      console.log('No item found in DynamoDB for uid:', uid);
      return null;
    }

    console.log('Found item in DynamoDB:', uid);
    return result.Item;
  } catch (error) {
    console.error('Error getting status from DynamoDB:', error);
    return null;
  }
}

async function getStatusFromBannerbear(uid, isCollection = false) {
  try {
    const apiUrl = isCollection 
      ? `https://api.bannerbear.com/v2/collections/${uid}`
      : `https://api.bannerbear.com/v2/images/${uid}`;
    
    console.log(`Checking Bannerbear status directly for ${isCollection ? 'collection' : 'image'} ${uid}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Bannerbear API Error:', response.status, response.statusText);
      return null;
    }

    const responseText = await response.text();
    console.log('Bannerbear raw response length:', responseText.length);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing Bannerbear response:', error);
      return null;
    }
    
    console.log('Bannerbear direct status check result:', {
      uid: data.uid,
      status: data.status,
      hasImageUrls: !!data.image_urls && Object.keys(data.image_urls || {}).length,
      hasImages: !!data.images && data.images.length,
      hasZipUrl: !!data.zip_url
    });
    
    // Return all the data from Bannerbear in a consistent format
    return {
      uid: data.uid,
      status: data.status,
      type: isCollection ? 'collection' : 'single',
      image_url: data.image_url,
      image_url_png: data.image_url_png,
      image_url_jpg: data.image_url_jpg,
      created_at: data.created_at,
      updated_at: data.updated_at,
      image_urls: data.image_urls || {},
      images: data.images || [],
      template_set: data.template_set,
      zip_url: data.zip_url,
      metadata: data.metadata,
      last_checked: new Date().toISOString(),
      raw_response: isCollection ? data : undefined // For debugging collections only
    };
  } catch (error) {
    console.error('Error checking Bannerbear directly:', error);
    return null;
  }
}

async function saveStatusToDynamo(status) {
  if (!dynamoDB) {
    console.log('DynamoDB not configured, skipping status save');
    return false;
  }
  
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...status,
        ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days TTL
      }
    };

    await dynamoDB.put(params).promise();
    console.log('Successfully saved status to DynamoDB:', status.uid);
    return true;
  } catch (error) {
    console.error('Error saving status to DynamoDB:', error);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid } = req.query;
  const isCollection = req.query.type === 'collection';
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  console.log('Getting status for:', uid, 'isCollection:', isCollection);

  try {
    // First try DynamoDB
    let status = await getStatusFromDynamo(uid);
    
    // Check if we need to retrieve fresh data from Bannerbear
    const needsFreshData = !status || 
                          status.status === 'pending' ||
                          (status.status === 'completed' && 
                          isCollection && 
                          (!status.images || status.images.length === 0) && 
                          (!status.image_urls || Object.keys(status.image_urls).length === 0));
    
    if (needsFreshData) {
      console.log('Fetching fresh data from Bannerbear for uid:', uid);
      // Try Bannerbear API directly
      const freshStatus = await getStatusFromBannerbear(uid, isCollection);
      
      if (freshStatus) {
        // Update our status with fresh data
        status = freshStatus;
        
        // If we got status from Bannerbear, store it in DynamoDB
        await saveStatusToDynamo(status);
      }
    }

    if (!status) {
      return res.status(404).json({ 
        message: 'Status not found',
        uid,
        status: 'unknown',
        type: isCollection ? 'collection' : 'single'
      });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      uid,
      status: 'error',
      type: isCollection ? 'collection' : 'single'
    });
  }
} 