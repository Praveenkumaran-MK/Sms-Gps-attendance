# Render Deployment Guide

## Quick Setup

### 1. In Render Dashboard

1. **Create New Web Service**
   - Connect your GitHub repository
   - Branch: `main`

2. **Configure Build Settings**
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `node src/server.js`
   - **Environment:** Node

3. **Add Environment Variables**

Required variables:
```
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=your_supabase_connection_string
DIRECT_URL=your_supabase_direct_connection_string

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# TextBee
TEXTBEE_API_KEY=your_textbee_api_key
TEXTBEE_DEVICE_ID=your_device_id
TEXTBEE_API_URL=https://api.textbee.dev

# Unwired Labs
UNWIRED_API_KEY=your_unwired_api_key
UNWIRED_API_URL=https://us1.unwiredlabs.com/v2/process.php
DEFAULT_MCC=404
DEFAULT_MNC=40

# Security
ADMIN_SECRET=your_admin_secret
```

### 2. Get Supabase Connection Strings

**DATABASE_URL (Connection Pooling):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**DIRECT_URL (Direct Connection):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Get from: Supabase Dashboard → Project Settings → Database → Connection string

### 3. Update TextBee Webhook

Once deployed, update TextBee webhook URL to:
```
https://your-app-name.onrender.com/api/track/sms
```

### 4. Deploy

Click "Create Web Service" - Render will automatically deploy!

---

## Troubleshooting

### Build Fails: "Cannot find module"
- ✅ Fixed: Updated package.json with correct start script

### Prisma Client Not Generated
- Add `npx prisma generate` to build command

### Database Connection Fails
- Check DATABASE_URL and DIRECT_URL are correct
- Ensure Supabase allows connections from Render IPs

### Environment Variables Missing
- Add all required variables in Render dashboard
- Don't commit `.env` to git

---

## Testing Deployment

Once deployed, test:

```bash
# Health check
curl https://your-app-name.onrender.com/health

# Test webhook
curl -X POST https://your-app-name.onrender.com/api/track/sms \
  -H "Content-Type: application/json" \
  -d '{"sender":"+919566794604","message":"ATT CID:1234 LAC:1"}'
```

---

## Auto-Deploy

Render automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Update"
git push origin main
```

Render will rebuild and redeploy automatically!
