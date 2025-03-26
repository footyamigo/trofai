const express = require('express');
const bodyParser = require('body-parser');
const { processBannerbearWebhook } = require('./test-rightmove');

const app = express();
app.use(bodyParser.json());

// Store image and collection status updates
const statusMap = new Map();

// Webhook endpoint for Bannerbear
app.post('/webhooks/bannerbear', (req, res) => {
    const webhookSecret = process.env.BANNERBEAR_WEBHOOK_SECRET;
    const authHeader = req.headers.authorization;

    // Verify webhook secret
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
        console.error('Invalid webhook secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const webhookData = req.body;
    console.log('Received webhook from Bannerbear:', webhookData);

    // Process the webhook data
    const processedData = processBannerbearWebhook(webhookData);
    
    // Store the status update with type information
    statusMap.set(webhookData.uid, {
        ...processedData,
        updatedAt: new Date().toISOString()
    });

    res.status(200).json({ received: true });
});

// Endpoint to check status
app.get('/image-status/:uid', (req, res) => {
    const { uid } = req.params;
    const status = statusMap.get(uid);

    if (!status) {
        return res.status(404).json({ error: 'Status not found' });
    }

    res.json(status);
});

// Endpoint to list all statuses (useful for debugging)
app.get('/statuses', (req, res) => {
    const statuses = Array.from(statusMap.entries()).map(([uid, data]) => ({
        uid,
        ...data
    }));
    res.json(statuses);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
});

module.exports = app; 