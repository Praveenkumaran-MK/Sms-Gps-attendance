/**
 * Test endpoint to verify webhook is reachable
 * This will help diagnose if TextBee can reach your server
 */

const express = require('express');
const router = express.Router();

// Simple test endpoint
router.post('/test', (req, res) => {
  console.log('='.repeat(50));
  console.log('TEST WEBHOOK RECEIVED!');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('='.repeat(50));
  
  res.json({ 
    success: true, 
    message: 'Test webhook received successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'GeoGuard SMS Webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
