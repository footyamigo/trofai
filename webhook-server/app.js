require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send({ status: 'Webhook server is running' });
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
  console.log('Webhook verification request received');
  res.status(200).send('Webhook active');
});

// Webhook data endpoint
app.post('/webhook', (req, res) => {
  console.log('Webhook data received:', JSON.stringify(req.body));
  res.status(200).send({ status: 'success', message: 'Webhook data received' });
});

// Start server
app.listen(port, () => {
  console.log(`Webhook server listening on port ${port}`);
}); 