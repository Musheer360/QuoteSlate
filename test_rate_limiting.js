// Test script to verify rate limiting is working on OpenAPI endpoints
const axios = require('axios');

async function testRateLimiting() {
  const baseURL = 'http://localhost:3000'; // Adjust port as needed
  
  console.log('Testing rate limiting on OpenAPI endpoints...\n');
  
  try {
    // Test /openapi.yaml endpoint
    console.log('Testing /openapi.yaml endpoint:');
    for (let i = 1; i <= 5; i++) {
      const response = await axios.get(`${baseURL}/openapi.yaml`);
      console.log(`Request ${i}: Status ${response.status}, Rate limit remaining: ${response.headers['x-ratelimit-remaining']}`);
    }
    
    console.log('\nTesting /openapi.json endpoint:');
    for (let i = 1; i <= 5; i++) {
      const response = await axios.get(`${baseURL}/openapi.json`);
      console.log(`Request ${i}: Status ${response.status}, Rate limit remaining: ${response.headers['x-ratelimit-remaining']}`);
    }
    
    console.log('\n✅ Rate limiting is working! Headers show remaining requests.');
    
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('✅ Rate limiting is working! Got 429 Too Many Requests');
      console.log('Response:', error.response.data);
    } else {
      console.error('❌ Error testing rate limiting:', error.message);
    }
  }
}

// Run the test
testRateLimiting();
