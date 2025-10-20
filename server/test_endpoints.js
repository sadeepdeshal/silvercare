const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('🔍 Testing caregiver API endpoints...\n');

  const endpoints = [
    { method: 'GET', url: 'http://localhost:5000/api/caregivers', name: 'Get all caregivers' },
    { method: 'POST', url: 'http://localhost:5000/api/caregivers/temporary-booking', name: 'Create temporary booking' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint.name}`);
      console.log(`${endpoint.method} ${endpoint.url}`);
      
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (endpoint.method === 'POST') {
        options.body = JSON.stringify({
          elderId: 1,
          caregiverId: 1,
          familyId: 1,
          selectedDates: ['2025-01-15'],
          totalAmount: 5000
        });
      }

      const response = await fetch(endpoint.url, options);
      const contentType = response.headers.get('content-type');
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log('Response (first 200 chars):', text.substring(0, 200));
      }
      
      console.log('✅ Endpoint exists\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

testEndpoints();
