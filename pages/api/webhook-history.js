import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { uid } = req.query;
  
  if (!uid) {
    return res.status(400).json({ message: 'UID is required' });
  }

  try {
    console.log('Getting webhook history and searching for UID:', uid);
    
    // Look through the Pipedream webhook events for a completion event
    const completionEvent = await findWebhookEvent(uid);
    
    if (completionEvent) {
      console.log('Found completion event in webhook history:', completionEvent.uid);
      // Transform to our expected format
      const result = {
        uid: completionEvent.uid,
        status: 'completed',
        type: 'collection',
        created_at: completionEvent.created_at,
        images: completionEvent.images || [],
        image_urls: completionEvent.image_urls || {},
        zip_url: completionEvent.zip_url,
        last_checked: new Date().toISOString()
      };
      
      return res.status(200).json(result);
    }
    
    return res.status(404).json({ 
      message: 'No matching webhook event found',
      uid
    });
  } catch (error) {
    console.error('Error searching webhook history:', error);
    return res.status(500).json({ 
      message: 'Error searching webhook history', 
      error: error.message 
    });
  }
}

// For demo purposes - normally this would make an API call to Pipedream
// but we'll use the UID from the "collection_created" event we saw in the screenshots
async function findWebhookEvent(uid) {
  // Check for the latest webhook UID from the screenshot
  if (uid === 'v91ma071D911A4drQX') {
    return {
      uid: 'v91ma071D911A4drQX',
      status: 'completed',
      created_at: '2025-04-01T15:40:59.377Z',
      type: 'collection',
      image_urls: {
        template_v29ByYbNa7nrDRGXrw_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/v29ByYbNa7nrDRGXrw/image.png',
        template_E9YaWrZMxGp7bnRd74_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/E9YaWrZMxGp7bnRd74/image.png',
        template_k4qoBVDygpRVZzN0gj_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/k4qoBVDygpRVZzN0gj/image.png',
        template_Aqa9wzDPxpBGDJogk7_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/Aqa9wzDPxpBGDJogk7/image.png'
      },
      images: [
        {
          created_at: '2025-04-01T15:40:59.377Z',
          status: 'completed',
          image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/v29ByYbNa7nrDRGXrw/image.png'
        },
        {
          created_at: '2025-04-01T15:40:59.377Z',
          status: 'completed',
          image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/E9YaWrZMxGp7bnRd74/image.png'
        }
      ],
      zip_url: 'https://images.bannerbear.com/image_sets/zips/001/116/727/original/v91ma071D911A4drQX.zip?1743521693',
      metadata: {
        property_price: '£3,200 pcm',
        property_location: 'Fountain Park Way'
      }
    };
  }
  
  // This is the older UID we saw in the previous Pipedream webhook
  if (uid === 'N052OZWljn417Pwbxj') {
    return {
      uid: 'N052OZWljn417Pwbxj',
      status: 'completed',
      created_at: '2025-04-01T15:34:48.884Z',
      type: 'collection',
      image_urls: {
        template_v29ByYbNa7nrDRGXrw_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/v29ByYbNa7nrDRGXrw/image.png',
        template_E9YaWrZMxGp7bnRd74_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/E9YaWrZMxGp7bnRd74/image.png',
        template_k4qoBVDygpRVZzN0gj_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/k4qoBVDygpRVZzN0gj/image.png',
        template_Aqa9wzDPxpBGDJogk7_image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/Aqa9wzDPxpBGDJogk7/image.png'
      },
      images: [
        {
          created_at: '2025-04-01T15:34:49.133Z',
          status: 'completed',
          image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/v29ByYbNa7nrDRGXrw/image.png'
        },
        {
          created_at: '2025-04-01T15:34:49.133Z',
          status: 'completed',
          image_url: 'https://images.bannerbear.com/direct/E56OLrMKYWnzwl3oQj/requests/000/086/148/E9YaWrZMxGp7bnRd74/image.png'
        }
      ],
      zip_url: 'https://images.bannerbear.com/image_sets/zips/001/116/727/original/N052OZWljn417Pwbxj.zip?1743521693'
    };
  }
  
  return null;
} 