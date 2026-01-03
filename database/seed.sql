-- =====================================================
-- GEOGUARD DATABASE SEEDING SCRIPT
-- =====================================================
-- Run this AFTER running geoguard_schema.sql
-- Provides sample data for testing the GeoGuard system
-- Created: 2026-01-03

-- =====================================================
-- CLEAR EXISTING DATA (OPTIONAL - USE WITH CAUTION)
-- =====================================================
-- Uncomment these lines if you want to reset the database
-- TRUNCATE TABLE attendance_logs CASCADE;
-- TRUNCATE TABLE live_status CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE sites CASCADE;

-- =====================================================
-- SEED SITES
-- =====================================================

-- Insert sample construction sites
INSERT INTO sites (id, name, center_lat, center_lng, radius_meters, rest_interval_minutes) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Chennai Construction Site A', 13.0827, 80.2707, 200, 60),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Mumbai Metro Project', 19.0760, 72.8777, 300, 90),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Bangalore Tech Park', 12.9716, 77.5946, 250, 60)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED USERS (MANAGERS)
-- =====================================================

-- Insert managers (password: "manager123" hashed with bcrypt)
-- Note: In production, use proper password hashing
INSERT INTO users (id, name, phone, password_hash, role, phone_type, site_id) VALUES
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Rajesh Kumar', '+919876543210', '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv', 'MANAGER', 'SMART', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Priya Sharma', '+919876543211', '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv', 'MANAGER', 'SMART', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Amit Patel', '+919876543212', '$2a$10$rZ8qXKJ9YvH5xKJ9YvH5xOqXKJ9YvH5xKJ9YvH5xKJ9YvH5xKJ9Yv', 'MANAGER', 'SMART', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f')
ON CONFLICT (id) DO NOTHING;

-- Update sites with manager IDs
UPDATE sites SET manager_id = 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a' WHERE id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
UPDATE sites SET manager_id = 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b' WHERE id = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
UPDATE sites SET manager_id = 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c' WHERE id = 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f';

-- =====================================================
-- SEED USERS (WORKERS)
-- =====================================================

-- Chennai Site Workers
INSERT INTO users (id, name, phone, role, phone_type, site_id) VALUES
-- Smartphone workers
('11111111-1111-1111-1111-111111111111', 'PREMNATH S', '+917598253348', 'WORKER', 'SMART', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('22222222-2222-2222-2222-222222222222', 'RAM', '+919876543221', 'WORKER', 'SMART', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('33333333-3333-3333-3333-333333333333', 'Lakshmi Devi', '+919876543222', 'WORKER', 'SMART', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
-- Feature phone workers
('44444444-4444-4444-4444-444444444444', 'SHANMUGA PRIYAN', '+919566794604', 'WORKER', 'FEATURE', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),
('55555555-5555-5555-5555-555555555555', 'Karthik', '+919876543224', 'WORKER', 'FEATURE', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'),

-- Mumbai Site Workers
('66666666-6666-6666-6666-666666666666', 'Anil Deshmukh', '+919876543225', 'WORKER', 'SMART', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'),
('77777777-7777-7777-7777-777777777777', 'Sanjay Patil', '+919876543226', 'WORKER', 'SMART', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'),
('88888888-8888-8888-8888-888888888888', 'Ramesh Yadav', '+919876543227', 'WORKER', 'FEATURE', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e'),

-- Bangalore Site Workers
('99999999-9999-9999-9999-999999999999', 'Venkat Reddy', '+919876543228', 'WORKER', 'SMART', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Krishna Kumar', '+919876543229', 'WORKER', 'FEATURE', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED LIVE STATUS
-- =====================================================

-- Initialize live_status for all workers
INSERT INTO live_status (user_id, last_lat, last_lng, is_inside, last_seen, battery_level) VALUES
-- Chennai workers (some inside, some outside)
('11111111-1111-1111-1111-111111111111', 13.0827, 80.2707, true, NOW() - INTERVAL '5 minutes', 85),
('22222222-2222-2222-2222-222222222222', 13.0830, 80.2710, true, NOW() - INTERVAL '10 minutes', 60),
('33333333-3333-3333-3333-333333333333', 13.0850, 80.2750, false, NOW() - INTERVAL '45 minutes', 15),
('44444444-4444-4444-4444-444444444444', 13.0825, 80.2705, true, NOW() - INTERVAL '15 minutes', NULL),
('55555555-5555-5555-5555-555555555555', 13.0900, 80.2800, false, NOW() - INTERVAL '120 minutes', NULL),

-- Mumbai workers
('66666666-6666-6666-6666-666666666666', 19.0760, 72.8777, true, NOW() - INTERVAL '3 minutes', 92),
('77777777-7777-7777-7777-777777777777', 19.0765, 72.8780, true, NOW() - INTERVAL '8 minutes', 45),
('88888888-8888-8888-8888-888888888888', 19.0770, 72.8785, true, NOW() - INTERVAL '20 minutes', NULL),

-- Bangalore workers
('99999999-9999-9999-9999-999999999999', 12.9716, 77.5946, true, NOW() - INTERVAL '2 minutes', 78),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 12.9720, 77.5950, true, NOW() - INTERVAL '25 minutes', NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- SEED ATTENDANCE LOGS
-- =====================================================

-- Sample attendance logs for today
INSERT INTO attendance_logs (user_id, timestamp, lat, lng, is_offline_sync, distance_meters, is_inside_geofence, location_method) VALUES
-- Chennai Site - Ravi (smartphone, inside)
('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 hours', 13.0827, 80.2707, false, 0, true, 'GPS'),
('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 hours 55 minutes', 13.0828, 80.2708, false, 15, true, 'GPS'),
('11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 hours 50 minutes', 13.0827, 80.2707, false, 5, true, 'GPS'),

-- Chennai Site - Suresh (smartphone, went outside)
('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 hours 30 minutes', 13.0830, 80.2710, false, 35, true, 'GPS'),
('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 hours', 13.0850, 80.2750, false, 450, false, 'GPS'),
('22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 hour', 13.0830, 80.2710, false, 35, true, 'GPS'),

-- Chennai Site - Lakshmi (smartphone, offline sync batch)
('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 hours', 13.0825, 80.2705, true, 25, true, 'GPS'),
('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '4 hours 55 minutes', 13.0826, 80.2706, true, 20, true, 'GPS'),
('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '4 hours 50 minutes', 13.0827, 80.2707, true, 10, true, 'GPS'),

-- Chennai Site - Murugan (feature phone, SMS-based)
('44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '2 hours 30 minutes', 13.0825, 80.2705, false, 28, true, 'CELL'),
('44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '30 minutes', 13.0828, 80.2708, false, 18, true, 'CELL'),

-- Mumbai Site - Anil (smartphone)
('66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '3 hours', 19.0760, 72.8777, false, 0, true, 'GPS'),
('66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '2 hours 55 minutes', 19.0761, 72.8778, false, 12, true, 'GPS'),

-- Bangalore Site - Venkat (smartphone)
('99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '4 hours 15 minutes', 12.9716, 77.5946, false, 5, true, 'GPS'),
('99999999-9999-9999-9999-999999999999', NOW() - INTERVAL '4 hours 10 minutes', 12.9717, 77.5947, false, 15, true, 'GPS')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check seeded data
SELECT 'Sites' as table_name, COUNT(*) as count FROM sites
UNION ALL
SELECT 'Users (Total)', COUNT(*) FROM users
UNION ALL
SELECT 'Users (Managers)', COUNT(*) FROM users WHERE role = 'MANAGER'
UNION ALL
SELECT 'Users (Workers)', COUNT(*) FROM users WHERE role = 'WORKER'
UNION ALL
SELECT 'Users (Smart Phones)', COUNT(*) FROM users WHERE phone_type = 'SMART'
UNION ALL
SELECT 'Users (Feature Phones)', COUNT(*) FROM users WHERE phone_type = 'FEATURE'
UNION ALL
SELECT 'Live Status', COUNT(*) FROM live_status
UNION ALL
SELECT 'Attendance Logs', COUNT(*) FROM attendance_logs;

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- View all sites with their managers
-- SELECT s.name as site_name, u.name as manager_name, s.radius_meters, s.rest_interval_minutes
-- FROM sites s
-- LEFT JOIN users u ON s.manager_id = u.id;

-- View all workers by site
-- SELECT s.name as site_name, u.name as worker_name, u.phone_type, u.phone
-- FROM users u
-- JOIN sites s ON u.site_id = s.id
-- WHERE u.role = 'WORKER'
-- ORDER BY s.name, u.name;

-- View live status for Chennai site
-- SELECT u.name, u.phone_type, ls.is_inside, ls.last_seen, ls.battery_level
-- FROM users u
-- JOIN live_status ls ON u.user_id = ls.user_id
-- WHERE u.site_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
-- ORDER BY ls.last_seen DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database seeding completed successfully!';
    RAISE NOTICE '📊 Created 3 sites, 3 managers, 10 workers';
    RAISE NOTICE '📍 Initialized live_status for all workers';
    RAISE NOTICE '📝 Added sample attendance logs';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Test Credentials:';
    RAISE NOTICE 'Manager Phone: +919876543210 (Chennai)';
    RAISE NOTICE 'Worker (Smart): +919876543220 (Ravi)';
    RAISE NOTICE 'Worker (Feature): +919876543223 (Murugan)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Test Site IDs:';
    RAISE NOTICE 'Chennai: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
    RAISE NOTICE 'Mumbai: b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e';
    RAISE NOTICE 'Bangalore: c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f';
END $$;
