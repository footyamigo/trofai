// This is a utility endpoint for testing purposes
// It simulates as if we got a webhook from a completed collection

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const testCollection = {
    uid: 'N052OZWljn417Pwbxj',
    status: 'completed',
    type: 'collection',
    created_at: '2025-04-01T15:34:48.884Z',
    updated_at: '2025-04-01T15:34:49.133Z',
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
    zip_url: 'https://images.bannerbear.com/image_sets/zips/001/116/727/original/N052OZWljn417Pwbxj.zip?1743521693',
    metadata: {
      property_title: 'Beautiful Apartment in Fountain Park Way',
      property_price: '£3,200 pcm'
    }
  };

  return res.status(200).json(testCollection);
} 