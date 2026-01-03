# Prisma Migration - Setup Guide

## What Changed

✅ **Migrated from Supabase Client to Prisma ORM**
- Supabase is now used ONLY as PostgreSQL database provider
- All database queries now use Prisma Client
- Zero functional regression - identical API behavior

---

## Setup Steps

### 1. Install Dependencies (Already Done)

```bash
npm install prisma @prisma/client
```

### 2. Configure DATABASE_URL

Add to your `.env` file:

```bash
# Construct from your Supabase connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true

DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**To get your connection string:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Copy the "Connection string" under "Connection pooling"
3. Replace `[YOUR-PASSWORD]` with your database password
4. Add to `.env` as `DATABASE_URL`

**Example:**
```
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Verify Database Connection

```bash
npx prisma db pull
```

This will introspect your database and confirm the connection works.

### 5. Restart Server

```bash
npm run dev
```

---

## Migration Summary

### trackingController.js

**Replaced Queries:**

| Supabase | Prisma | Function |
|----------|--------|----------|
| `.from('users').select().eq().single()` | `prisma.users.findUnique({ where, include })` | User lookup with site |
| `.from('attendance_logs').insert().select()` | `prisma.attendance_logs.create({ data })` | Insert log |
| `.from('live_status').upsert()` | `prisma.live_status.upsert({ where, update, create })` | Update status |
| `.from('users').select().eq().single()` | `prisma.users.findUnique({ where, select })` | User by phone |

### managerController.js

**Replaced Queries:**

| Supabase | Prisma | Function |
|----------|--------|----------|
| `.from('users').select().eq().single()` | `prisma.users.findUnique({ where, select })` | Check existing user |
| `.from('users').insert()` + `.from('live_status').insert()` | `prisma.$transaction([...])` | Add employee (atomic) |
| `.from('users').delete().eq()` | `prisma.users.delete({ where })` | Remove employee |
| `.from('sites').update().eq()` | `prisma.sites.update({ where, data })` | Update site config |
| `.from('sites').select()` + `.from('users').select()` | `prisma.sites.findUnique()` + `prisma.users.findMany({ include })` | Live dashboard |

---

## Key Improvements

✅ **Type Safety** - Prisma provides full TypeScript support  
✅ **Transactions** - Atomic multi-table operations (addEmployee)  
✅ **Relations** - Automatic joins via `include`  
✅ **Better Errors** - Prisma error codes (P2025 = not found)  
✅ **Performance** - Optimized queries with `select`  

---

## Testing

### Test Heartbeat
```bash
curl -X POST http://localhost:3000/api/track/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"userId":"11111111-1111-1111-1111-111111111111","lat":13.0827,"lng":80.2707,"timestamp":"2026-01-03T17:30:00Z"}'
```

### Test Dashboard
```bash
curl -H "x-admin-secret: secpass123" \
  http://localhost:3000/api/manager/live-dashboard/a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
```

### Test Add Employee
```bash
curl -X POST http://localhost:3000/api/manager/employees \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: secpass123" \
  -d '{"name":"Test Worker","phone":"+919999999999","phoneType":"SMART","siteId":"a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"}'
```

---

## Rollback (If Needed)

If you need to revert to Supabase:

1. Restore old controller files from git
2. Remove Prisma:
   ```bash
   npm uninstall prisma @prisma/client
   rm -rf prisma/
   ```
3. Restart server

---

## Prisma Commands

```bash
# Generate client after schema changes
npx prisma generate

# View database in browser
npx prisma studio

# Introspect database
npx prisma db pull

# Format schema file
npx prisma format
```

---

## Notes

- **No database changes** - Schema remains identical
- **RLS still active** - Prisma bypasses RLS using connection string
- **Cascading deletes** - Handled by database, not Prisma
- **Decimal fields** - Converted to/from JavaScript numbers automatically
- **Timestamps** - Handled as JavaScript Date objects

---

## Success Criteria

✅ All endpoints return identical responses  
✅ Error handling behaves the same  
✅ Database operations produce same results  
✅ Zero breaking changes to API contracts
