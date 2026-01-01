const https = require('https');

const API_KEY = 'pk.ccbab88ae003fb09fc26aaf26fb188af';
const PHONE = '9655811578';

const data = JSON.stringify({
  token: API_KEY,
  address: 1,
  phone: PHONE
});

console.log('Testing Unwired Labs API...');
console.log('API Key:', API_KEY);
console.log('Phone:', PHONE);
console.log('---');

const options = {
  hostname: 'us1.unwiredlabs.com',
  path: '/process.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('\nResponse:');
    const result = JSON.parse(body);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'ok') {
      console.log('\n✅ SUCCESS! API Key is working!');
      console.log('📍 Location:', result.lat, result.lon);
      console.log('🎯 Accuracy:', result.accuracy, 'meters');
      console.log('📮 Address:', result.address || 'N/A');
      console.log('💰 Balance:', result.balance || 'Unknown');
    } else {
      console.log('\n❌ ERROR:', result.message);
      console.log('Balance:', result.balance);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.write(data);
req.end();