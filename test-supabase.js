/**
 * Quick test script to verify Supabase connection and query users
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('\n🔍 Testing Supabase Connection\n');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

// Test with service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function testQuery() {
  console.log('\n1️⃣ Testing query with user ID...\n');
  
  const userId = '11111111-1111-1111-1111-111111111111';
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, phone, site_id, sites(id, name, center_lat, center_lng, radius_meters)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    console.log('\nPossible issues:');
    console.log('1. Wrong SUPABASE_SERVICE_KEY in .env');
    console.log('2. RLS policies blocking access');
    console.log('3. User ID not in database');
    return;
  }

  if (!data) {
    console.log('❌ No user found with that ID');
    return;
  }

  console.log('✅ User found:', data);
  console.log('\n2️⃣ Testing site data...\n');
  
  if (!data.site_id || !data.sites) {
    console.log('⚠️  User has no site assigned');
  } else {
    console.log('✅ Site:', data.sites);
  }
}

testQuery();
