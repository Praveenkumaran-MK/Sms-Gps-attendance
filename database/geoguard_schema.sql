-- =====================================================
-- GEOGUARD CONSTRUCTION ATTENDANCE SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Hybrid attendance tracking for smartphones (GPS) and feature phones (SMS)
-- Run this in Supabase SQL Editor
-- Created: 2026-01-03

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager_id UUID,
    center_lat NUMERIC(10, 7) NOT NULL,
    center_lng NUMERIC(10, 7) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 200,
    rest_interval_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_manager ON sites(manager_id);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(is_active);

COMMENT ON TABLE sites IS 'Construction sites with geofence settings and manager assignments';
COMMENT ON COLUMN sites.center_lat IS 'Latitude of site center point';
COMMENT ON COLUMN sites.center_lng IS 'Longitude of site center point';
COMMENT ON COLUMN sites.radius_meters IS 'Geofence radius in meters';
COMMENT ON COLUMN sites.rest_interval_minutes IS 'Daily rest/break time in minutes for net hours calculation';

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('MANAGER', 'WORKER')),
    phone_type TEXT NOT NULL CHECK (phone_type IN ('SMART', 'FEATURE')),
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

COMMENT ON TABLE users IS 'System users including managers and workers';
COMMENT ON COLUMN users.phone IS 'Phone number in international format (e.g., +919876543210)';
COMMENT ON COLUMN users.role IS 'User role: MANAGER (site supervisor) or WORKER (field employee)';
COMMENT ON COLUMN users.phone_type IS 'SMART (GPS heartbeats) or FEATURE (SMS-based tracking)';

-- Add foreign key constraint for manager_id in sites table
ALTER TABLE sites
ADD CONSTRAINT fk_sites_manager 
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- LIVE STATUS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS live_status (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_lat NUMERIC(10, 7),
    last_lng NUMERIC(10, 7),
    is_inside BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE,
    battery_level INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_status_is_inside ON live_status(is_inside);
CREATE INDEX IF NOT EXISTS idx_live_status_last_seen ON live_status(last_seen DESC);

COMMENT ON TABLE live_status IS 'Real-time worker location and status for dashboard';
COMMENT ON COLUMN live_status.is_inside IS 'Whether worker is currently inside geofence';
COMMENT ON COLUMN live_status.last_seen IS 'Timestamp of most recent location update';
COMMENT ON COLUMN live_status.battery_level IS 'Battery percentage (0-100) for smart phones';

-- =====================================================
-- ATTENDANCE LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    is_offline_sync BOOLEAN NOT NULL DEFAULT false,
    distance_meters NUMERIC(10, 2),
    is_inside_geofence BOOLEAN,
    location_method TEXT DEFAULT 'GPS' CHECK (location_method IN ('GPS', 'CELL', 'WIFI', 'PHONE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_user ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_timestamp ON attendance_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_offline_sync ON attendance_logs(is_offline_sync);

COMMENT ON TABLE attendance_logs IS 'Historical location pings for all workers (GPS and SMS-based)';
COMMENT ON COLUMN attendance_logs.is_offline_sync IS 'True if data came from batch upload (offline store-and-forward)';
COMMENT ON COLUMN attendance_logs.location_method IS 'GPS (smartphone), CELL (cell tower), PHONE (HLR lookup), WIFI (WiFi triangulation)';

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sites table
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for live_status table
CREATE TRIGGER update_live_status_updated_at
    BEFORE UPDATE ON live_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all tables
CREATE POLICY "Service role full access to sites"
    ON sites FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to users"
    ON users FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to live_status"
    ON live_status FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to attendance_logs"
    ON attendance_logs FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Managers can read their assigned sites
CREATE POLICY "Managers can read their sites"
    ON sites FOR SELECT TO authenticated
    USING (manager_id = auth.uid());

-- Workers can read their own user data
CREATE POLICY "Users can read their own data"
    ON users FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Workers can read their own live status
CREATE POLICY "Users can read their own live_status"
    ON live_status FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Workers can read their own attendance logs
CREATE POLICY "Users can read their own attendance_logs"
    ON attendance_logs FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Insert a sample site (Chennai Construction Site)
INSERT INTO sites (name, center_lat, center_lng, radius_meters, rest_interval_minutes)
VALUES ('Chennai Construction Site A', 13.0827, 80.2707, 200, 60)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this to verify all tables were created successfully:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- Expected output:
-- attendance_logs
-- live_status
-- sites
-- users
