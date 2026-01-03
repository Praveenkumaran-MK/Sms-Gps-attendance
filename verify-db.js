/**
 * GeoGuard Database Verification Script
 * Tests database connection and checks if data is seeded
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function verifyDatabase() {
  console.log('\n🔍 GeoGuard Database Verification\n');
  console.log('='.repeat(50));

  try {
    // Test connection
    console.log('\n1️⃣ Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('sites')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      console.log('\n💡 Fix: Check your SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
      return;
    }
    console.log('✅ Connection successful!');

    // Check sites
    console.log('\n2️⃣ Checking sites table...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*');

    if (sitesError) {
      console.error('❌ Error:', sitesError.message);
      console.log('\n💡 Fix: Run database/geoguard_schema.sql in Supabase SQL Editor');
      return;
    }

    if (!sites || sites.length === 0) {
      console.log('⚠️  No sites found in database');
      console.log('\n💡 Fix: Run database/seed.sql in Supabase SQL Editor');
      console.log('   This will create 3 test sites with workers');
      return;
    }

    console.log(`✅ Found ${sites.length} site(s):`);
    sites.forEach(site => {
      console.log(`   - ${site.name} (ID: ${site.id.substring(0, 8)}...)`);
    });

    // Check users
    console.log('\n3️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error:', usersError.message);
      return;
    }

    const managers = users.filter(u => u.role === 'MANAGER');
    const workers = users.filter(u => u.role === 'WORKER');
    const smartWorkers = workers.filter(w => w.phone_type === 'SMART');
    const featureWorkers = workers.filter(w => w.phone_type === 'FEATURE');

    console.log(`✅ Found ${users.length} user(s):`);
    console.log(`   - ${managers.length} manager(s)`);
    console.log(`   - ${workers.length} worker(s) (${smartWorkers.length} SMART, ${featureWorkers.length} FEATURE)`);

    // Check live_status
    console.log('\n4️⃣ Checking live_status table...');
    const { data: liveStatus, error: liveError } = await supabase
      .from('live_status')
      .select('*');

    if (liveError) {
      console.error('❌ Error:', liveError.message);
      return;
    }

    console.log(`✅ Found ${liveStatus?.length || 0} live status record(s)`);

    // Check attendance_logs
    console.log('\n5️⃣ Checking attendance_logs table...');
    const { data: logs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('count');

    if (logsError) {
      console.error('❌ Error:', logsError.message);
      return;
    }

    console.log(`✅ Found attendance logs in database`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ DATABASE STATUS: READY');
    console.log('\n📊 Summary:');
    console.log(`   Sites: ${sites.length}`);
    console.log(`   Managers: ${managers.length}`);
    console.log(`   Workers: ${workers.length}`);
    console.log(`   Live Status: ${liveStatus?.length || 0}`);

    console.log('\n🧪 Test with:');
    console.log(`   curl -H "x-admin-secret: ${process.env.ADMIN_SECRET}" http://localhost:3000/api/manager/live-dashboard/${sites[0].id}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.log('\n💡 Check your .env file configuration');
  }
}

// Run verification
verifyDatabase();
