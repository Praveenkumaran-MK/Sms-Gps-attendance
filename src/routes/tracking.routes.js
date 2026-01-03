/**
 * GeoGuard Tracking Routes
 * Routes for GPS heartbeats and SMS webhooks
 */

const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// POST /api/track/heartbeat - Handle GPS heartbeats (single or batch)
router.post('/heartbeat', trackingController.handleHeartbeat);

// POST /api/track/sms - Handle SMS webhook from TextBee
router.post('/sms', trackingController.handleSmsWebhook);

module.exports = router;
