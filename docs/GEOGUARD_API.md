# GeoGuard API Documentation

## Overview

GeoGuard provides a hybrid construction attendance system with support for both smartphones (GPS tracking) and feature phones (SMS-based cell tower triangulation).

**Base URL:** `http://localhost:3000` (development) or your deployed URL

---

## Authentication

Manager endpoints require authentication via the `x-admin-secret` header or `adminSecret` query parameter.

```bash
# Header method (recommended)
curl -H "x-admin-secret: your_secret_here" http://localhost:3000/api/manager/...

# Query parameter method
curl http://localhost:3000/api/manager/...?adminSecret=your_secret_here
```

---

## Tracking Endpoints

### POST /api/track/heartbeat

Record GPS location from smartphones. Supports both single heartbeat and batch uploads for offline sync.

**Single Heartbeat:**
```json
{
  "userId": "uuid-here",
  "lat": 13.0827,
  "lng": 80.2707,
  "timestamp": "2026-01-03T11:30:00Z"
}
```

**Batch Upload (Offline Sync):**
```json
{
  "userId": "uuid-here",
  "logs": [
    {
      "lat": 13.0827,
      "lng": 80.2707,
      "timestamp": "2026-01-03T10:00:00Z"
    },
    {
      "lat": 13.0828,
      "lng": 80.2708,
      "timestamp": "2026-01-03T10:05:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat processed successfully",
  "data": {
    "userId": "uuid-here",
    "timestamp": "2026-01-03T11:30:00Z",
    "isInside": true,
    "distance": 45.23,
    "logId": "log-uuid"
  }
}
```

---

### POST /api/track/sms

Webhook endpoint for TextBee SMS gateway. Receives SMS from feature phones with cell tower data.

**Request (from TextBee):**
```json
{
  "sender": "+919876543210",
  "message": "ATT CID:4521 LAC:120"
}
```

**SMS Format:**
Workers send: `ATT CID:xxxx LAC:yyyy`
- CID: Cell ID
- LAC: Location Area Code

**Response:**
```json
{
  "success": true,
  "message": "SMS processed successfully",
  "data": {
    "user": "Worker Name",
    "location": {
      "lat": 13.0827,
      "lng": 80.2707
    },
    "isInside": true,
    "distance": 123.45
  }
}
```

**SMS Confirmation:**
Worker receives: `Attendance recorded. Status: INSIDE geofence (123m from site)`

---

## Manager Endpoints

All manager endpoints require `x-admin-secret` header.

### POST /api/manager/employees

Add a new worker to the system.

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "phoneType": "SMART",
  "siteId": "site-uuid-here",
  "password": "optional-password"
}
```

**Fields:**
- `name` (required): Worker's full name
- `phone` (required): Phone number in international format
- `phoneType` (required): `SMART` or `FEATURE`
- `siteId` (required): UUID of assigned site
- `password` (optional): For future authentication features

**Response:**
```json
{
  "success": true,
  "message": "Employee added successfully",
  "data": {
    "id": "worker-uuid",
    "name": "John Doe",
    "phone": "+919876543210",
    "phoneType": "SMART",
    "siteId": "site-uuid"
  }
}
```

---

### DELETE /api/manager/employees/:id

Remove a worker from the system.

**Request:**
```bash
DELETE /api/manager/employees/worker-uuid-here
```

**Response:**
```json
{
  "success": true,
  "message": "Employee removed successfully"
}
```

---

### PUT /api/manager/site-config/:siteId

Update site geofence radius and rest interval settings.

**Request:**
```json
{
  "radiusMeters": 300,
  "restIntervalMinutes": 90
}
```

**Fields:**
- `radiusMeters` (optional): Geofence radius (50-5000 meters)
- `restIntervalMinutes` (optional): Daily rest/break time (0-480 minutes)

**Response:**
```json
{
  "success": true,
  "message": "Site configuration updated successfully",
  "data": {
    "id": "site-uuid",
    "name": "Chennai Construction Site A",
    "radiusMeters": 300,
    "restIntervalMinutes": 90
  }
}
```

---

### GET /api/manager/live-dashboard/:siteId

Get real-time status of all workers at a site.

**Request:**
```bash
GET /api/manager/live-dashboard/site-uuid-here
```

**Response:**
```json
{
  "success": true,
  "site_name": "Chennai Construction Site A",
  "workers": [
    {
      "name": "Raju",
      "type": "FEATURE",
      "status": "GREEN",
      "last_seen": "2 mins ago",
      "battery_warning": false,
      "battery_level": null
    },
    {
      "name": "Sam",
      "type": "SMART",
      "status": "RED",
      "last_seen": "45 mins ago (OFFLINE?)",
      "battery_warning": true,
      "battery_level": 15
    }
  ],
  "summary": {
    "total_workers": 2,
    "inside_geofence": 1,
    "outside_geofence": 1
  }
}
```

**Status Colors:**
- `GREEN`: Inside geofence and recently active
- `RED`: Outside geofence or offline (>30 minutes)

**Battery Warning:**
- Triggered when smartphone battery < 20%
- `null` for feature phones

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (invalid admin secret)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (e.g., phone number already registered)
- `500`: Internal Server Error

---

## Example Workflows

### Smartphone Worker Check-in Flow

1. Worker opens app and taps "Check In"
2. App captures GPS coordinates
3. App sends POST to `/api/track/heartbeat`:
   ```json
   {
     "userId": "worker-uuid",
     "lat": 13.0827,
     "lng": 80.2707,
     "timestamp": "2026-01-03T09:00:00Z"
   }
   ```
4. Server validates geofence and updates `live_status`
5. App receives confirmation

### Feature Phone Worker Check-in Flow

1. Worker sends SMS: `ATT CID:4521 LAC:120`
2. TextBee forwards to `/api/track/sms`
3. Server parses CID/LAC and calls Unwired Labs API
4. Server validates geofence with resolved coordinates
5. Worker receives SMS: `Attendance recorded. Status: INSIDE geofence (45m from site)`

### Manager Dashboard Check

1. Manager opens dashboard
2. Dashboard calls `/api/manager/live-dashboard/site-uuid`
3. Server returns real-time status of all workers
4. Dashboard displays:
   - Green indicators for workers inside geofence
   - Red indicators for workers outside or offline
   - Time since last seen
   - Battery warnings for smartphones

---

## Webhook Configuration

### TextBee Setup

1. Log in to [TextBee Dashboard](https://textbee.dev/dashboard)
2. Navigate to Webhooks
3. Add webhook URL: `https://your-domain.com/api/track/sms`
4. Select "Incoming SMS" event
5. Save configuration

**Test Webhook:**
```bash
curl -X POST http://localhost:3000/api/track/sms \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "+919876543210",
    "message": "ATT CID:4521 LAC:120"
  }'
```

---

## Rate Limits

- **Heartbeat API**: No limit (designed for 5-minute intervals)
- **SMS Webhook**: Limited by TextBee plan
- **Unwired Labs**: Check your plan at [unwiredlabs.com/dashboard](https://unwiredlabs.com/dashboard)
  - Typical: 1 credit per cell tower lookup
  - Free tier: 100 requests/day

---

## Testing

### Test Heartbeat (Single)
```bash
curl -X POST http://localhost:3000/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-worker-uuid",
    "lat": 13.0827,
    "lng": 80.2707,
    "timestamp": "2026-01-03T11:30:00Z"
  }'
```

### Test Heartbeat (Batch)
```bash
curl -X POST http://localhost:3000/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-worker-uuid",
    "logs": [
      {"lat": 13.0827, "lng": 80.2707, "timestamp": "2026-01-03T10:00:00Z"},
      {"lat": 13.0828, "lng": 80.2708, "timestamp": "2026-01-03T10:05:00Z"}
    ]
  }'
```

### Test Manager Dashboard
```bash
curl -X GET http://localhost:3000/api/manager/live-dashboard/your-site-uuid \
  -H "x-admin-secret: your_admin_secret"
```

### Test Add Employee
```bash
curl -X POST http://localhost:3000/api/manager/employees \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_secret" \
  -d '{
    "name": "Test Worker",
    "phone": "+919876543210",
    "phoneType": "SMART",
    "siteId": "your-site-uuid"
  }'
```
