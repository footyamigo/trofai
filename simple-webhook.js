const express = require('express');
const app = express();
const port = 3000;

// Parse JSON bodies
app.use(express.json());

// Simple GET endpoint for Bannerbear verification
app.get('/webhook', (req, res) => {
  res.status(200).send('OK');
});

// Simple POST endpoint for webhook data
app.post('/webhook', (req, res) => {
  console.log('Received webhook:', req.body);
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 