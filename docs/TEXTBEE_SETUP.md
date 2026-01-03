# TextBee SMS Gateway Setup Guide

## Overview

Configure TextBee to forward SMS messages from real phones to your GeoGuard backend.

---

## Prerequisites

- TextBee account (https://textbee.dev)
- Android phone with TextBee app installed
- ngrok or public URL for your backend

---

## Setup Steps

### 1. Update Environment Variables

Add your public URL to `.env`:

```bash
APP_URL=https://designingly-snubby-numbers.ngrok-free.dev
```

### 2. Configure TextBee Webhook

#### Option A: Via TextBee Dashboard

1. **Login to TextBee**
   - Go to https://textbee.dev/dashboard
   - Login with your credentials

2. **Navigate to Webhooks**
   - Go to Settings → Webhooks
   - Or API Settings → Incoming SMS Webhook

3. **Set Webhook URL**
   ```
   https://designingly-snubby-numbers.ngrok-free.dev/api/track/sms
   ```

4. **Configure Settings**
   - Method: `POST`
   - Content-Type: `application/json`
   - Enable: ✅ Enabled

#### Option B: Via TextBee API

```bash
curl -X POST https://api.textbee.dev/api/v1/gateway/webhook \
  -H "x-api-key: YOUR_TEXTBEE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://designingly-snubby-numbers.ngrok-free.dev/api/track/sms",
    "method": "POST",
    "events": ["sms.received"]
  }'
```

---

## Webhook Payload Format

TextBee sends SMS data in this format:

```json
{
  "from": "+919566794604",
  "message": "ATT CID:1234 LAC:1",
  "timestamp": "2026-01-04T00:23:00Z",
  "device_id": "your-device-id"
}
```

**Supported Field Names:**
- Phone: `from`, `sender`, `phone`
- Message: `message`, `text`, `body`

---

## Testing

### 1. Test with curl (Simulates TextBee)

```bash
curl -X POST https://designingly-snubby-numbers.ngrok-free.dev/api/track/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+919566794604",
    "message": "ATT CID:1234 LAC:1"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMS processed successfully",
  "data": {
    "user": "SHANMUGA PRIYAN",
    "location": { "lat": 13.1143, "lng": 80.1018 },
    "isInside": false,
    "distance": 13500
  }
}
```

### 2. Test with Real SMS

1. **Send SMS to TextBee Number**
   - From: +919566794604 (or any registered worker phone)
   - To: Your TextBee gateway number
   - Message: `ATT CID:1234 LAC:1`

2. **Check Backend Logs**
   ```
   [SMS Webhook] Received from +919566794604: ATT CID:1234 LAC:1
   [SMS Webhook] Using fixed location for test phone +919566794604 (Avadi, Chennai)
   [Tracking] Processing heartbeat for user 44444444-4444-4444-4444-444444444444
   ```

3. **Worker Receives SMS**
   ```
   Attendance recorded. Status: OUTSIDE geofence (13500m from site)
   ```

---

## Worker SMS Format

Workers should send SMS in this format:

```
ATT CID:xxxxx LAC:yyy
```

**Examples:**
```
ATT CID:1234 LAC:1
ATT CID:197400786 LAC:42137
CID:4521 LAC:120
```

---

## Troubleshooting

### Issue: Webhook not receiving SMS

**Check:**
1. TextBee webhook URL is correct
2. ngrok is running and URL is active
3. Backend server is running (`npm run dev`)
4. Check TextBee logs for webhook delivery status

**Test webhook manually:**
```bash
curl -X POST http://localhost:3000/api/track/sms \
  -H "Content-Type: application/json" \
  -d '{"from":"+919566794604","message":"ATT CID:1234 LAC:1"}'
```

### Issue: "User not found" error

**Solution:**
- Ensure phone number is registered in database
- Check phone number format (must include country code: +91...)
- Verify user exists:
  ```bash
  curl -H "x-admin-secret: secpass123" \
    http://localhost:3000/api/manager/live-dashboard/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
  ```

### Issue: "Invalid SMS format" error

**Solution:**
- SMS must contain both CID and LAC
- Format: `ATT CID:xxxxx LAC:yyy`
- Case insensitive
- Spaces optional

---

## ngrok Setup (If Needed)

### 1. Install ngrok

```bash
# Download from https://ngrok.com/download
# Or use chocolatey
choco install ngrok
```

### 2. Start ngrok

```bash
ngrok http 3000
```

### 3. Copy Public URL

```
Forwarding: https://designingly-snubby-numbers.ngrok-free.dev -> http://localhost:3000
```

### 4. Update TextBee Webhook

Use the ngrok URL in TextBee webhook settings.

---

## Production Deployment

For production, replace ngrok with:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`
- Custom domain: `https://api.yourdomain.com`

Update `.env`:
```bash
APP_URL=https://your-production-domain.com
```

---

## Security Considerations

### 1. Webhook Authentication (Recommended)

Add TextBee signature verification:

```javascript
// In trackingController.js
const signature = req.headers['x-textbee-signature'];
if (signature !== process.env.TEXTBEE_WEBHOOK_SECRET) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const smsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 requests per minute
});

router.post('/sms', smsLimiter, trackingController.handleSmsWebhook);
```

---

## Flow Diagram

```
Worker Phone (+919566794604)
    |
    | Sends SMS: "ATT CID:1234 LAC:1"
    ↓
TextBee Gateway Number
    |
    | Webhook POST
    ↓
https://designingly-snubby-numbers.ngrok-free.dev/api/track/sms
    |
    | Parse CID/LAC
    ↓
Check if test phone (+919566794604)
    |
    ├─ Yes → Use fixed Avadi location (13.1143, 80.1018)
    └─ No  → Call Unwired Labs API
    |
    | Calculate geofence
    ↓
Save to database (attendance_logs, live_status)
    |
    | Send confirmation SMS
    ↓
Worker receives: "Attendance recorded. Status: OUTSIDE geofence (13500m from site)"
```

---

## Summary

✅ **Webhook URL:** `https://designingly-snubby-numbers.ngrok-free.dev/api/track/sms`  
✅ **Method:** POST  
✅ **Content-Type:** application/json  
✅ **Test Phone:** +919566794604 (uses fixed Avadi location)  
✅ **SMS Format:** `ATT CID:xxxxx LAC:yyy`  

The system is ready to receive real SMS messages from TextBee!
