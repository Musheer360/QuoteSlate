#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTests() {
  console.log('Running QuoteSlate API tests...\n');

  let testsPassed = 0;
  let totalTests = 0;

  function test(name, condition) {
    totalTests++;
    if (condition) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name}`);
    }
  }

  try {
    // Test basic functionality
    console.log('Testing basic functionality:');
    const randomQuoteResponse = await makeRequest('/api/quotes/random');
    test('Random quote endpoint returns 200', randomQuoteResponse.statusCode === 200);
    
    const quote = JSON.parse(randomQuoteResponse.body);
    test('Random quote has required fields', quote.id && quote.quote && quote.author && quote.length && quote.tags);

    const authorsResponse = await makeRequest('/api/authors');
    test('Authors endpoint returns 200', authorsResponse.statusCode === 200);

    const tagsResponse = await makeRequest('/api/tags');
    test('Tags endpoint returns 200', tagsResponse.statusCode === 200);

    console.log();

    // Test error handling
    console.log('Testing error handling:');
    
    const invalidCountResponse = await makeRequest('/api/quotes/random?count=0');
    test('Invalid count parameter rejected', invalidCountResponse.statusCode === 400);

    const nonNumericCountResponse = await makeRequest('/api/quotes/random?count=5a');
    test('Non-numeric count parameter rejected', nonNumericCountResponse.statusCode === 400);

    const alphaNumericCountResponse = await makeRequest('/api/quotes/random?count=10abc');
    test('Alphanumeric count parameter rejected', alphaNumericCountResponse.statusCode === 400);

    const exponentialCountResponse = await makeRequest('/api/quotes/random?count=5e2');
    test('Exponential notation count parameter rejected', exponentialCountResponse.statusCode === 400);

    const negativeMinResponse = await makeRequest('/api/quotes/random?minLength=-50');
    test('Negative minLength rejected', negativeMinResponse.statusCode === 400);

    const invalidMethodResponse = await makeRequest('/api/quotes/random', 'POST');
    test('Invalid HTTP method returns 405', invalidMethodResponse.statusCode === 405);

    const invalidPathResponse = await makeRequest('/api/quotes/invalid');
    test('Invalid API path returns 404', invalidPathResponse.statusCode === 404);

    console.log();

    // Test security headers
    console.log('Testing security headers:');
    test('X-Content-Type-Options header present', randomQuoteResponse.headers['x-content-type-options'] === 'nosniff');
    test('X-Frame-Options header present', randomQuoteResponse.headers['x-frame-options'] === 'DENY');
    test('X-XSS-Protection header present', randomQuoteResponse.headers['x-xss-protection'] === '1; mode=block');

    console.log();

    // Summary
    console.log('=== Test Summary ===');
    console.log(`${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Check if server is running before running tests
makeRequest('/api/quotes/random')
  .then(() => {
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server with "npm start" before running tests.');
    process.exit(1);
  });
