import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ message: 'Input query is required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('Google Places API key is missing.');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;

  try {
    const response = await axios.get(url, {
      params: {
        input,
        key: apiKey,
        types: '(regions)', // Focus on regions, which often include neighborhoods, localities
        // Optionally add: components: `country:XX`
      },
    });

    if (response.data.status === 'OK') {
      const predictions = response.data.predictions.map(pred => ({
        description: pred.description,
        place_id: pred.place_id,
        neighborhood: pred.structured_formatting && pred.structured_formatting.main_text ? pred.structured_formatting.main_text : pred.terms[0].value,
        fullSuggestion: pred.description
      }));
      return res.status(200).json(predictions);
    } else if (response.data.status === 'ZERO_RESULTS') {
      return res.status(200).json([]);
    } else {
      console.error('Google Places API Error:', response.data.status, response.data.error_message);
      return res.status(500).json({ message: 'Error fetching suggestions from Google Places API', details: response.data.status });
    }
  } catch (error) {
    console.error('Axios error calling Google Places API:', error.message);
    return res.status(500).json({ message: 'Failed to fetch location suggestions' });
  }
} 