# Production Configuration Guide

## Your Deployed App

**Production URL:** `https://sms-gps-attendance.onrender.com`

---

## 1. Update TextBee Webhook

### Configure in TextBee Dashboard:

1. Go to https://textbee.dev/dashboard
2. Navigate to Webhooks
3. **Set Webhook URL to:**
   ```
   https://sms-gps-attendance.onrender.com/api/track/sms
   ```
4. Method: POST
5. Content-Type: application/json
6. Save changes

---

## 2. Test Your Production Deployment

### Health Check
```bash
curl https://sms-gps-attendance.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2026-01-04T01:31:00Z"
}
```

### Test SMS Webhook
```bash
curl -X POST https://sms-gps-attendance.onrender.com/api/track/sms \
  -H "Content-Type: application/json" \
  -d '{"sender":"+919566794604","message":"ATT CID:1234 LAC:1"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMS processed successfully",
  "data": {
    "user": "SHANMUGA PRIYAN",
    "location": {"lat": 13.1143, "lng": 80.1018},
    "isInside": false,
    "distance": 13500
  }
}
```

### Test Manager Dashboard
```bash
curl -H "x-admin-secret: secpass123" \
  https://sms-gps-attendance.onrender.com/api/manager/live-dashboard/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
```

### Test Heartbeat
```bash
curl -X POST https://sms-gps-attendance.onrender.com/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"userId":"11111111-1111-1111-1111-111111111111","lat":13.0827,"lng":80.2707,"timestamp":"2026-01-04T01:31:00Z"}'
```

---

## 3. Environment Variables in Render

Make sure these are set in Render Dashboard → Environment:

```
NODE_ENV=production
PORT=3000
APP_URL=https://sms-gps-attendance.onrender.com

# Database
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:5432/postgres

# Supabase
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# TextBee
TEXTBEE_API_KEY=your_api_key
TEXTBEE_DEVICE_ID=your_device_id
TEXTBEE_API_URL=https://api.textbee.dev

# Unwired Labs
UNWIRED_API_KEY=your_api_key
UNWIRED_API_URL=https://us1.unwiredlabs.com/v2/process.php
DEFAULT_MCC=404
DEFAULT_MNC=40

# Security
ADMIN_SECRET=your_admin_secret
```

---

## 4. Real Phone Testing

Once TextBee webhook is configured:

1. **Send SMS from +919566794604 to your TextBee number:**
   ```
   ATT CID:1234 LAC:1
   ```

2. **Worker will receive confirmation SMS:**
   ```
   Attendance recorded. Status: OUTSIDE geofence (13500m from site)
   ```

3. **Check dashboard:**
   ```bash
   curl -H "x-admin-secret: secpass123" \
     https://sms-gps-attendance.onrender.com/api/manager/live-dashboard/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
   ```

---

## 5. Troubleshooting

### No response from SMS
- Check Render logs: Render Dashboard → Your App → Logs
- Verify TextBee webhook URL is correct
- Test webhook manually with curl command above

### "User not found" error
- Ensure phone number is in database
- Check with dashboard endpoint
- Verify DATABASE_URL is set correctly

### 500 Internal Server Error
- Check Render logs for errors
- Verify all environment variables are set
- Ensure Prisma Client was generated (check build logs)

---

## 6. API Endpoints (Production)

All endpoints use base URL: `https://sms-gps-attendance.onrender.com`

- **Health:** `GET /health`
- **SMS Webhook:** `POST /api/track/sms`
- **Heartbeat:** `POST /api/track/heartbeat`
- **Live Dashboard:** `GET /api/manager/live-dashboard/:siteId`
- **Add Employee:** `POST /api/manager/employees`
- **Remove Employee:** `DELETE /api/manager/employees/:id`
- **Update Site:** `PUT /api/manager/site-config/:siteId`

---

## Summary

✅ **Production URL:** `https://sms-gps-attendance.onrender.com`  
✅ **TextBee Webhook:** `https://sms-gps-attendance.onrender.com/api/track/sms`  
✅ **Test Phone:** +919566794604 (uses fixed Avadi location)  
✅ **SMS Format:** `ATT CID:xxxxx LAC:yyy`

Your app is ready for production use!
