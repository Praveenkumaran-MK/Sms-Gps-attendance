# GeoGuard Database Setup Guide

## Quick Start

### 1. Run Schema
```sql
-- In Supabase SQL Editor
-- Copy and run: database/geoguard_schema.sql
```

### 2. Run Seed Data (Optional)
```sql
-- In Supabase SQL Editor
-- Copy and run: database/seed.sql
```

---

## Seed Data Overview

The seed script creates:

### 🏗️ Sites (3)
- **Chennai Construction Site A** - 200m radius, 60min rest
- **Mumbai Metro Project** - 300m radius, 90min rest
- **Bangalore Tech Park** - 250m radius, 60min rest

### 👔 Managers (3)
- Rajesh Kumar (+919876543210) - Chennai
- Priya Sharma (+919876543211) - Mumbai
- Amit Patel (+919876543212) - Bangalore

### 👷 Workers (10)
**Chennai Site:**
- Ravi Shankar (+919876543220) - SMART
- Suresh Babu (+919876543221) - SMART
- Lakshmi Devi (+919876543222) - SMART
- Murugan (+919876543223) - FEATURE
- Karthik (+919876543224) - FEATURE

**Mumbai Site:**
- Anil Deshmukh (+919876543225) - SMART
- Sanjay Patil (+919876543226) - SMART
- Ramesh Yadav (+919876543227) - FEATURE

**Bangalore Site:**
- Venkat Reddy (+919876543228) - SMART
- Krishna Kumar (+919876543229) - FEATURE

### 📊 Sample Data
- Live status for all workers (some inside, some outside geofence)
- Attendance logs with various scenarios (offline sync, SMS-based, etc.)

---

## Test Credentials

### Manager Login
```
Phone: +919876543210
Password: manager123
Site: Chennai Construction Site A
```

### Worker Testing

**Smartphone Worker (GPS):**
```
User ID: 11111111-1111-1111-1111-111111111111
Phone: +919876543220
Name: Ravi Shankar
```

**Feature Phone Worker (SMS):**
```
User ID: 44444444-4444-4444-4444-444444444444
Phone: +919876543223
Name: Murugan
```

---

## Test Site IDs

```javascript
// Chennai
const chennaiSiteId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

// Mumbai
const mumbaiSiteId = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';

// Bangalore
const bangaloreSiteId = 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f';
```

---

## Testing Scenarios

### 1. Test Manager Dashboard
```bash
curl -X GET http://localhost:3000/api/manager/live-dashboard/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d \ -H "x-admin-secret: secpass123"
```

**Expected Response:**
- 5 workers (3 SMART, 2 FEATURE)
- Mix of GREEN (inside) and RED (outside) statuses
- Battery warnings for low battery smartphones

### 2. Test Smartphone Heartbeat
```bash
curl -X POST http://localhost:3000/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11111111-1111-1111-1111-111111111111",
    "lat": 13.0827,
    "lng": 80.2707,
    "timestamp": "2026-01-03T12:00:00Z"
  }'
```

### 3. Test Feature Phone SMS
```bash
curl -X POST http://localhost:3000/api/track/sms \-H "Content-Type: application/json" \  -d '{"sender": "919566794604","message": "ATT CID:4521 LAC:120"}'
```

### 4. Test Add Employee
```bash
curl -X POST http://localhost:3000/api/manager/employees \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_secret" \
  -d '{
    "name": "New Worker",
    "phone": "+919876543230",
    "phoneType": "SMART",
    "siteId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
  }'
```

---

## Useful Queries

### View All Sites with Managers
```sql
SELECT s.name as site_name, u.name as manager_name, 
       s.radius_meters, s.rest_interval_minutes
FROM sites s
LEFT JOIN users u ON s.manager_id = u.id;
```

### View Workers by Site
```sql
SELECT s.name as site_name, u.name as worker_name, 
       u.phone_type, u.phone
FROM users u
JOIN sites s ON u.site_id = s.id
WHERE u.role = 'WORKER'
ORDER BY s.name, u.name;
```

### Check Live Status
```sql
SELECT u.name, u.phone_type, ls.is_inside, 
       ls.last_seen, ls.battery_level
FROM users u
JOIN live_status ls ON u.id = ls.user_id
WHERE u.site_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
ORDER BY ls.last_seen DESC;
```

### View Today's Attendance Logs
```sql
SELECT u.name, al.timestamp, al.lat, al.lng,
       al.is_inside_geofence, al.location_method
FROM attendance_logs al
JOIN users u ON al.user_id = u.id
WHERE al.timestamp::date = CURRENT_DATE
ORDER BY al.timestamp DESC;
```

---

## Reset Database

To clear all data and reseed:

```sql
-- Clear data (preserves schema)
TRUNCATE TABLE attendance_logs CASCADE;
TRUNCATE TABLE live_status CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE sites CASCADE;

-- Then run seed.sql again
```

---

## Production Setup

⚠️ **Important:** The seed script is for **testing only**!

For production:
1. Don't use the seed script
2. Create real manager accounts with proper passwords
3. Use the Manager API to add workers
4. Configure actual site coordinates and geofence radius

---

## Next Steps

1. ✅ Run `geoguard_schema.sql` in Supabase
2. ✅ Run `seed.sql` for test data
3. ✅ Update `.env` with your credentials
4. ✅ Start server: `npm run dev`
5. ✅ Test endpoints with sample data above
