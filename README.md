# GeoGuard - Hybrid Construction Attendance System

📱 **Smart + Feature Phone Attendance Tracking** using GPS heartbeats and SMS-based cell tower triangulation.

## Features

- ✅ **Dual Device Support** - Smartphones (GPS) and feature phones (SMS)
- ✅ **Offline Capability** - Store-and-forward batch uploads for smartphones
- ✅ **Cell Tower Triangulation** - Feature phone location via Unwired Labs
- ✅ **Real-time Dashboard** - Live worker status with GREEN/RED indicators
- ✅ **Multi-site Management** - Support for multiple construction sites
- ✅ **Geofencing** - Validates employee location within work radius
- ✅ **Manager Portal** - Employee CRUD and site configuration

## How It Works

### Smartphone Workers (Method A)
1. App sends GPS heartbeats every 5 minutes
2. Offline heartbeats stored locally and synced when online
3. System validates geofence and updates live status
4. Manager sees real-time GREEN/RED status on dashboard

### Feature Phone Workers (Method B)
1. Worker sends SMS: `ATT CID:4521 LAC:120`
2. System extracts cell tower data (CID/LAC)
3. Unwired Labs API resolves coordinates
4. System validates geofence and sends SMS confirmation
5. Manager sees status on dashboard

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **SMS Gateway:** TextBee (Android Gateway)
- **Geolocation:** Unwired Labs API (OpenCellID)
- **Deployment:** Railway / Render / Heroku / VPS

## Quick Start

### Prerequisites

- Node.js 16+
- Supabase account
- TextBee account (for SMS)
- Unwired Labs API key (for feature phones)

### Installation

```bash
# Clone repository
git clone https://github.com/Praveenkumaran-MK/Sms-Gps-attendance.git
cd sms-gps

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run database schema in Supabase SQL Editor
# 1. Copy contents of database/geoguard_schema.sql
# 2. (Optional) Copy contents of database/seed.sql for test data

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required variables:

- `TEXTBEE_API_KEY` - TextBee API key
- `UNWIRED_API_KEY` - Unwired Labs API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `ADMIN_SECRET` - Manager API authentication
- `DEFAULT_MCC` - Mobile Country Code (404 for India)
- `DEFAULT_MNC` - Mobile Network Code (45 for Airtel)

## API Endpoints

### Tracking
- `POST /api/track/heartbeat` - GPS heartbeats (single or batch)
- `POST /api/track/sms` - SMS webhook from TextBee

### Manager (requires `x-admin-secret` header)
- `POST /api/manager/employees` - Add worker
- `DELETE /api/manager/employees/:id` - Remove worker
- `PUT /api/manager/site-config/:siteId` - Update site settings
- `GET /api/manager/live-dashboard/:siteId` - Real-time dashboard

See [API Documentation](docs/GEOGUARD_API.md) for details.

## Database Schema

### sites
- Multi-site support with individual geofence settings
- Manager assignment per site
- Configurable rest intervals

### users
- Unified user management (MANAGER/WORKER)
- Role-based access control
- Device type tracking (SMART/FEATURE)

### live_status
- Real-time worker location and status
- Dashboard-ready data

### attendance_logs
- Historical location pings
- Offline sync support

## Project Structure

```text
sms-gps/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase client
│   ├── controllers/
│   │   ├── trackingController.js # Heartbeat & SMS webhook
│   │   └── managerController.js  # Employee CRUD & dashboard
│   ├── routes/
│   │   ├── tracking.routes.js    # Tracking endpoints
│   │   └── manager.routes.js     # Manager endpoints
│   ├── services/
│   │   ├── unwiredService.js     # Cell tower triangulation
│   │   └── sms.service.js        # TextBee integration
│   ├── utils/
│   │   └── geoService.js         # Geofencing (Haversine)
│   └── server.js                 # Express server
├── database/
│   └── geoguard_schema.sql       # GeoGuard database schema
├── docs/
│   ├── GEOGUARD_API.md          # API documentation
│   ├── ARCHITECTURE.md          # System design (legacy)
│   └── DEPLOYMENT.md            # Deployment guide
├── .env.example                 # Environment template
└── package.json
```

## Documentation

- 📖 [API Reference](docs/GEOGUARD_API.md) - **Start Here!**
- 📚 [Architecture](docs/ARCHITECTURE.md) - Legacy system design
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md) - Production setup

## Testing

```bash
# Start development server
npm run dev

# Test health endpoint
curl http://localhost:3000/health

# Test heartbeat (single)
curl -X POST http://localhost:3000/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"userId":"uuid","lat":13.0827,"lng":80.2707,"timestamp":"2026-01-03T11:30:00Z"}'

# Test manager dashboard
curl -X GET http://localhost:3000/api/manager/live-dashboard/site-uuid \
  -H "x-admin-secret: your_secret"
```

## Manager Dashboard Example

```json
{
  "site_name": "Chennai Construction Site A",
  "workers": [
    {
      "name": "Raju",
      "type": "FEATURE",
      "status": "GREEN",
      "last_seen": "2 mins ago",
      "battery_warning": false
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

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for step-by-step instructions.

**Quick Deploy:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License

## Author

**Praveenkumaran-MK**

## Support

For issues or questions:
- Check [API Documentation](docs/GEOGUARD_API.md)
- Review [Deployment Guide](docs/DEPLOYMENT.md)
- Open an issue on GitHub

---

**Made with ❤️ for construction workers**
