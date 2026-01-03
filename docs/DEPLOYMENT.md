# SMS GPS Attendance System - Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 16+ installed
- ✅ Supabase account ([sign up](https://supabase.com))
- ✅ TextBee account ([sign up](https://textbee.dev))
- ✅ Unwired Labs API key ([sign up](https://unwiredlabs.com))
- ✅ Android phone for TextBee gateway

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and create

### 1.2 Run Database Schema

1. Open SQL Editor in Supabase dashboard
2. Copy contents of `database/schema.sql`
3. Paste and run the SQL script
4. Verify tables created: `employees`, `attendance`

### 1.3 Get API Keys

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

⚠️ **Important:** Never expose `service_role` key in client-side code!

---

## Step 2: TextBee SMS Gateway Setup

### 2.1 Install TextBee App

1. Download TextBee app on Android phone
2. Sign up and verify account
3. Keep phone connected to internet 24/7

### 2.2 Get API Credentials

1. Go to [textbee.dev/dashboard](https://textbee.dev/dashboard)
2. Copy:
   - API Key → `TEXTBEE_API_KEY`
   - Device ID → `TEXTBEE_DEVICE_ID`

### 2.3 Configure Webhook (After Deployment)

1. Deploy your server first (see Step 4)
2. In TextBee dashboard, set webhook URL:
   ```
   https://your-app-url.com/webhook/sms-received
   ```
3. Test webhook by sending SMS to your phone

---

## Step 3: Unwired Labs API Setup

### 3.1 Get API Key

1. Sign up at [unwiredlabs.com](https://unwiredlabs.com)
2. Go to dashboard and copy API key → `UNWIRED_API_KEY`

### 3.2 Check Balance

- Phone number lookup: ~1 credit per request
- WiFi/Cell lookup: ~1 credit per request
- Purchase credits as needed

### 3.3 Test API (Optional)

```bash
node test.js
```

This will test phone number lookup with your API key.

---

## Step 4: Environment Configuration

### 4.1 Copy Environment Template

```bash
cp .env.example .env
```

### 4.2 Fill in Environment Variables

Edit `.env` and add your credentials:

```env
# Server
PORT=3000
NODE_ENV=production
APP_URL=https://your-app-url.com

# TextBee
TEXTBEE_API_KEY=your_key_here
TEXTBEE_DEVICE_ID=your_device_id
TEXTBEE_API_URL=https://api.textbee.dev

# Unwired Labs
UNWIRED_API_KEY=your_key_here
UNWIRED_API_URL=https://us1.unwiredlabs.com/process.php

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Admin
ADMIN_SECRET=generate_strong_secret_here
```

### 4.3 Generate Admin Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output to `ADMIN_SECRET`.

---

## Step 5: Deployment Options

Choose one deployment platform:

### Option A: Railway (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize Project:**
   ```bash
   railway init
   ```

4. **Add Environment Variables:**
   ```bash
   railway variables set SUPABASE_URL=https://xxx.supabase.co
   railway variables set SUPABASE_KEY=your_key
   # ... add all variables from .env
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get URL:**
   ```bash
   railway domain
   ```

7. **Update APP_URL:**
   ```bash
   railway variables set APP_URL=https://your-app.railway.app
   ```

---

### Option B: Render

1. **Create Account:** [render.com](https://render.com)

2. **New Web Service:**
   - Connect GitHub repo
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables:**
   - Go to Environment tab
   - Add all variables from `.env`

4. **Deploy:**
   - Render auto-deploys on git push

5. **Get URL:**
   - Copy from dashboard (e.g., `https://your-app.onrender.com`)

6. **Update APP_URL:**
   - Add `APP_URL` environment variable with your Render URL

---

### Option C: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   ```

2. **Login:**
   ```bash
   heroku login
   ```

3. **Create App:**
   ```bash
   heroku create your-app-name
   ```

4. **Add Environment Variables:**
   ```bash
   heroku config:set SUPABASE_URL=https://xxx.supabase.co
   heroku config:set SUPABASE_KEY=your_key
   # ... add all variables
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **Get URL:**
   ```bash
   heroku info
   ```

---

### Option D: VPS (Ubuntu)

1. **SSH into Server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone Repository:**
   ```bash
   git clone https://github.com/your-repo/sms-gps.git
   cd sms-gps
   ```

5. **Install Dependencies:**
   ```bash
   npm install
   ```

6. **Create .env:**
   ```bash
   nano .env
   # Paste your environment variables
   ```

7. **Start with PM2:**
   ```bash
   pm2 start src/server.js --name sms-attendance
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx (Optional):**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/sms-attendance
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sms-attendance /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL (Optional):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Step 6: Post-Deployment Configuration

### 6.1 Update TextBee Webhook

1. Go to TextBee dashboard
2. Set webhook URL: `https://your-deployed-url.com/webhook/sms-received`
3. Save

### 6.2 Test Health Check

```bash
curl https://your-deployed-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2026-01-02T12:00:00Z"
}
```

---

## Step 7: Register First Employee

Use admin API to register employees:

```bash
curl -X POST https://your-deployed-url.com/admin/employees \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_secret" \
  -d '{
    "phone": "+919876543210",
    "name": "John Doe",
    "work_lat": 13.0827,
    "work_lng": 80.2707,
    "geofence_radius": 200,
    "device_type": "smartphone"
  }'
```

Employee will receive welcome SMS.

---

## Step 8: Testing

### 8.1 Test SMS Commands

Send SMS from registered phone to TextBee number:

1. `HELP` - Should receive command list
2. `STATUS` - Should receive today's status
3. `CHECKIN` - Should receive location link (smartphone) or auto-process (feature phone)

### 8.2 Test Location Capture

For smartphones:
1. Click GPS link in SMS
2. Allow location access
3. Verify attendance marked

For feature phones:
1. System automatically gets location
2. Verify SMS confirmation received

### 8.3 Test Admin API

```bash
# Get all employees
curl https://your-deployed-url.com/admin/employees \
  -H "x-admin-secret: your_admin_secret"

# Get attendance records
curl https://your-deployed-url.com/admin/attendance \
  -H "x-admin-secret: your_admin_secret"
```

---

## Monitoring & Maintenance

### View Logs

**Railway:**
```bash
railway logs
```

**Render:**
- View in dashboard

**Heroku:**
```bash
heroku logs --tail
```

**VPS (PM2):**
```bash
pm2 logs sms-attendance
```

### Monitor Unwired Labs Balance

Check balance regularly at [unwiredlabs.com/dashboard](https://unwiredlabs.com/dashboard)

### Database Backups

Supabase provides automatic backups. Configure in Project Settings → Database → Backups.

---

## Troubleshooting

### Webhook Not Receiving SMS

1. Check TextBee webhook URL is correct
2. Verify server is accessible (test `/health` endpoint)
3. Check TextBee app is running on phone
4. View logs for errors

### Location Lookup Failing

1. Check Unwired Labs API balance
2. Verify API key is correct
3. Test with `node test.js`
4. Check phone number format (+91...)

### Attendance Not Marking

1. Check employee is registered
2. Verify geofence radius is appropriate
3. Check location accuracy
4. View server logs for errors

### SMS Not Sending

1. Verify TextBee API key is correct
2. Check TextBee device is online
3. View TextBee dashboard for errors
4. Check server logs

---

## Security Best Practices

1. ✅ Never commit `.env` to version control
2. ✅ Use strong `ADMIN_SECRET` (32+ characters)
3. ✅ Keep `SUPABASE_SERVICE_KEY` secret
4. ✅ Enable HTTPS (SSL) in production
5. ✅ Regularly update dependencies: `npm audit fix`
6. ✅ Monitor server logs for suspicious activity
7. ✅ Backup database regularly

---

## Scaling Considerations

### High Traffic

- Use Redis for session management
- Enable database connection pooling
- Use CDN for static assets
- Implement rate limiting

### Multiple Locations

- Add `location_id` field to employees
- Support multiple work locations per employee
- Create location management admin panel

### Advanced Features

- Web admin dashboard
- Attendance reports (CSV/PDF export)
- Real-time notifications
- Mobile app for employees
- Biometric verification

---

## Support

For issues or questions:
- Check logs first
- Review API documentation (`docs/API.md`)
- Test with `node test.js`
- Check Supabase, TextBee, Unwired Labs dashboards

---

## Next Steps

1. ✅ Deploy to production
2. ✅ Configure TextBee webhook
3. ✅ Register employees
4. ✅ Test end-to-end flow
5. ✅ Monitor for 24 hours
6. ✅ Train employees on SMS commands
7. ✅ Set up monitoring alerts
