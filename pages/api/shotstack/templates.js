import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Construct the absolute path to the config file
    // __dirname is not available in API routes, use process.cwd()
    const configDir = path.join(process.cwd(), 'config');
    const templatesPath = path.join(configDir, 'shotstack-templates.json');

    // Check if file exists
    if (!fs.existsSync(templatesPath)) {
       console.error(`Shotstack templates config file not found at: ${templatesPath}`);
       return res.status(500).json({ success: false, error: 'Configuration file not found.' });
    }

    // Read and parse the file
    const templatesJson = fs.readFileSync(templatesPath, 'utf8');
    const templates = JSON.parse(templatesJson);

    // Return the templates
    return res.status(200).json({ success: true, templates });

  } catch (error) {
    console.error('Error reading Shotstack templates config:', error);
    // Check for specific JSON parsing error
    if (error instanceof SyntaxError) {
      return res.status(500).json({ success: false, error: 'Error parsing configuration file.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to load video templates.' });
  }
} 