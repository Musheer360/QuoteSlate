/**
 * QuoteSlate API - Advanced Test Functions
 * 
 * This file contains advanced test functions for performance, concurrency,
 * edge cases, and stress testing.
 */

const { CONFIG, testResults, httpClient, DataGenerator } = require('./comprehensive.test.js');
const { performance } = require('perf_hooks');

// =============================================================================
// 4. PERFORMANCE & LOAD TESTS
// =============================================================================

async function testPerformanceAndLoad() {
  console.log('\n⚡ PERFORMANCE & LOAD TESTS');
  console.log('='.repeat(50));

  // Response time tests
  console.log('\n⏱️ Testing Response Times...');
  const endpoints = [
    '/api/quotes/random',
    '/api/quotes?page=1&limit=10',
    '/api/authors',
    '/api/tags',
    '/api/quotes/by-author/Albert%20Einstein',
    '/api/quotes/by-tag/motivation'
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = performance.now();
      const response = await httpClient.makeRequest(endpoint);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      testResults.recordTest('PERFORMANCE', `Response time ${endpoint}`, 
        responseTime < CONFIG.LIMITS.RESPONSE_TIME_THRESHOLD_MS, 
        `${responseTime.toFixed(2)}ms`, responseTime);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Response time ${endpoint}`, false, error.message);
    }
  }

  // Concurrent request tests
  console.log('\n🔄 Testing Concurrent Requests...');
  const concurrencyLevels = [5, 10, 25, 50];
  
  for (const concurrency of concurrencyLevels) {
    try {
      const requests = Array.from({ length: concurrency }, (_, i) => ({
        path: `/api/quotes/random?_=${i}`,
        options: { timeout: CONFIG.TIMEOUT.LONG }
      }));

      const startTime = performance.now();
      const responses = await httpClient.makeConcurrentRequests(requests, concurrency);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.statusCode === 200).length;
      const successRate = (successfulResponses / concurrency) * 100;

      testResults.recordTest('PERFORMANCE', `Concurrent requests (${concurrency})`, 
        successRate >= 90, 
        `${successfulResponses}/${concurrency} successful (${successRate.toFixed(1)}%), ${totalTime.toFixed(2)}ms total`, 
        totalTime);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Concurrent requests (${concurrency})`, false, error.message);
    }
  }

  // Memory usage during load
  console.log('\n💾 Testing Memory Usage Under Load...');
  const initialMemory = process.memoryUsage();
  
  try {
    const heavyRequests = Array.from({ length: 100 }, (_, i) => ({
      path: `/api/quotes?page=${i % 10 + 1}&limit=50&search=test`,
      options: { timeout: CONFIG.TIMEOUT.LONG }
    }));

    await httpClient.makeConcurrentRequests(heavyRequests, 20);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    testResults.recordTest('PERFORMANCE', 'Memory usage under load', 
      memoryIncrease < 100, 
      `Memory increased by ${memoryIncrease.toFixed(2)}MB`);
  } catch (error) {
    testResults.recordTest('PERFORMANCE', 'Memory usage under load', false, error.message);
  }

  // Large response handling
  console.log('\n📊 Testing Large Response Handling...');
  try {
    const response = await httpClient.makeRequest('/api/quotes?page=1&limit=100');
    const responseSize = Buffer.byteLength(response.body, 'utf8');
    
    testResults.recordTest('PERFORMANCE', 'Large response handling', 
      response.statusCode === 200 && responseSize > 0, 
      `Response size: ${(responseSize / 1024).toFixed(2)}KB`, response.responseTime);
  } catch (error) {
    testResults.recordTest('PERFORMANCE', 'Large response handling', false, error.message);
  }

  // Pagination performance
  console.log('\n📄 Testing Pagination Performance...');
  const pages = [1, 10, 50, 100];
  
  for (const page of pages) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=${page}&limit=20`);
      testResults.recordTest('PERFORMANCE', `Pagination page ${page}`, 
        response.responseTime < 2000, 
        `${response.responseTime.toFixed(2)}ms`, response.responseTime);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Pagination page ${page}`, false, error.message);
    }
  }
}

// =============================================================================
// 5. ERROR HANDLING & EDGE CASES
// =============================================================================

async function testErrorHandlingAndEdgeCases() {
  console.log('\n🚨 ERROR HANDLING & EDGE CASES');
  console.log('='.repeat(50));

  // Test invalid endpoints
  console.log('\n🔍 Testing Invalid Endpoints...');
  const invalidEndpoints = [
    '/api/quotes/invalid',
    '/api/invalid',
    '/api/quotes/random/extra',
    '/api/quotes/by-author/',
    '/api/quotes/by-tag/',
    '/api/authors/invalid',
    '/api/tags/invalid',
    '/api/',
    '/api',
    '/invalid'
  ];

  for (const endpoint of invalidEndpoints) {
    try {
      const response = await httpClient.makeRequest(endpoint);
      testResults.recordTest('ERROR_HANDLING', `Invalid endpoint ${endpoint}`, 
        response.statusCode === 404, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Invalid endpoint ${endpoint}`, false, error.message);
    }
  }

  // Test malformed requests
  console.log('\n🔧 Testing Malformed Requests...');
  const malformedRequests = [
    { path: '/api/quotes?page=', description: 'Empty page parameter' },
    { path: '/api/quotes?limit=', description: 'Empty limit parameter' },
    { path: '/api/quotes?page=1&limit=', description: 'Empty limit with valid page' },
    { path: '/api/quotes?page=&limit=10', description: 'Empty page with valid limit' },
    { path: '/api/quotes?search=', description: 'Empty search parameter' },
    { path: '/api/quotes?sort=', description: 'Empty sort parameter' },
    { path: '/api/quotes?order=', description: 'Empty order parameter' },
    { path: '/api/quotes?authors=', description: 'Empty authors parameter' },
    { path: '/api/quotes?tags=', description: 'Empty tags parameter' },
    { path: '/api/quotes?minLength=', description: 'Empty minLength parameter' },
    { path: '/api/quotes?maxLength=', description: 'Empty maxLength parameter' }
  ];

  for (const request of malformedRequests) {
    try {
      const response = await httpClient.makeRequest(request.path);
      testResults.recordTest('ERROR_HANDLING', `Malformed request: ${request.description}`, 
        response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 404, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Malformed request: ${request.description}`, false, error.message);
    }
  }

  // Test boundary values
  console.log('\n🎯 Testing Boundary Values...');
  const boundaryTests = [
    { path: '/api/quotes?page=1&limit=1', description: 'Minimum limit' },
    { path: '/api/quotes?page=1&limit=100', description: 'Maximum limit' },
    { path: '/api/quotes?page=999999&limit=10', description: 'Very high page number' },
    { path: '/api/quotes/random?count=1', description: 'Minimum count' },
    { path: '/api/quotes/random?count=50', description: 'Maximum count' },
    { path: '/api/quotes/random?minLength=1', description: 'Minimum length' },
    { path: '/api/quotes/random?maxLength=1000', description: 'Very high max length' },
    { path: '/api/quotes/random?minLength=1&maxLength=1', description: 'Equal min/max length' }
  ];

  for (const test of boundaryTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      testResults.recordTest('ERROR_HANDLING', `Boundary test: ${test.description}`, 
        response.statusCode === 200 || response.statusCode === 404, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Boundary test: ${test.description}`, false, error.message);
    }
  }

  // Test special characters in URLs
  console.log('\n🔤 Testing Special Characters in URLs...');
  const specialCharTests = [
    { char: '%20', description: 'Space (URL encoded)' },
    { char: '%21', description: 'Exclamation mark' },
    { char: '%22', description: 'Quote' },
    { char: '%23', description: 'Hash' },
    { char: '%24', description: 'Dollar sign' },
    { char: '%25', description: 'Percent sign' },
    { char: '%26', description: 'Ampersand' },
    { char: '%27', description: 'Apostrophe' },
    { char: '%28', description: 'Left parenthesis' },
    { char: '%29', description: 'Right parenthesis' },
    { char: '%2A', description: 'Asterisk' },
    { char: '%2B', description: 'Plus sign' },
    { char: '%2C', description: 'Comma' },
    { char: '%2D', description: 'Hyphen' },
    { char: '%2E', description: 'Period' },
    { char: '%2F', description: 'Forward slash' }
  ];

  for (const test of specialCharTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=test${test.char}test&limit=1`);
      testResults.recordTest('ERROR_HANDLING', `Special character: ${test.description}`, 
        response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 404, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Special character: ${test.description}`, false, error.message);
    }
  }

  // Test very long URLs
  console.log('\n📏 Testing Very Long URLs...');
  const longSearchTerm = 'a'.repeat(1000);
  try {
    const response = await httpClient.makeRequest(`/api/quotes?search=${longSearchTerm}&limit=1`);
    testResults.recordTest('ERROR_HANDLING', 'Very long URL', 
      response.statusCode === 400 || response.statusCode === 414, 
      `Got ${response.statusCode}`, response.responseTime);
  } catch (error) {
    testResults.recordTest('ERROR_HANDLING', 'Very long URL', true, 'Request failed (expected)');
  }

  // Test multiple parameter combinations
  console.log('\n🔗 Testing Multiple Parameter Combinations...');
  const combinationTests = [
    '/api/quotes?page=1&limit=10&search=love&sort=author&order=desc',
    '/api/quotes?page=2&limit=5&authors=Albert%20Einstein&tags=wisdom',
    '/api/quotes?search=life&minLength=50&maxLength=200&sort=length',
    '/api/quotes/random?count=5&authors=Mark%20Twain&tags=wisdom&minLength=10&maxLength=100'
  ];

  for (const path of combinationTests) {
    try {
      const response = await httpClient.makeRequest(path);
      testResults.recordTest('ERROR_HANDLING', `Parameter combination: ${path.substring(0, 50)}...`, 
        response.statusCode === 200 || response.statusCode === 404, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Parameter combination: ${path.substring(0, 50)}...`, false, error.message);
    }
  }
}

// =============================================================================
// 6. HTTP PROTOCOL COMPLIANCE
// =============================================================================

async function testHttpProtocolCompliance() {
  console.log('\n🌐 HTTP PROTOCOL COMPLIANCE TESTS');
  console.log('='.repeat(50));

  // Test HTTP methods
  console.log('\n📡 Testing HTTP Methods...');
  const methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  for (const method of methods) {
    try {
      const response = await httpClient.makeRequest('/api/quotes/random', { method });
      let expectedStatus;
      if (method === 'GET') expectedStatus = 200;
      else if (method === 'HEAD') expectedStatus = 200;
      else if (method === 'OPTIONS') expectedStatus = 200;
      else expectedStatus = 405;

      testResults.recordTest('HTTP_COMPLIANCE', `HTTP ${method} method`, 
        response.statusCode === expectedStatus, 
        `Expected ${expectedStatus}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', `HTTP ${method} method`, false, error.message);
    }
  }

  // Test HEAD method specifically
  console.log('\n👤 Testing HEAD Method Details...');
  try {
    const headResponse = await httpClient.makeRequest('/api/quotes/random', { method: 'HEAD' });
    const getResponse = await httpClient.makeRequest('/api/quotes/random');
    
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method returns no body', 
      headResponse.body === '', 
      `HEAD body length: ${headResponse.body.length}`);
    
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method returns same headers as GET', 
      headResponse.headers['content-type'] === getResponse.headers['content-type'], 
      'Content-Type headers match');
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method test', false, error.message);
  }

  // Test OPTIONS method (CORS preflight)
  console.log('\n🔄 Testing OPTIONS Method (CORS)...');
  try {
    const response = await httpClient.makeRequest('/api/quotes/random', { method: 'OPTIONS' });
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS method returns 200', 
      response.statusCode === 200, 
      `Got ${response.statusCode}`);
    
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS includes CORS headers', 
      response.headers['access-control-allow-origin'] === '*', 
      'Access-Control-Allow-Origin header present');
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS method test', false, error.message);
  }

  // Test HTTP status codes
  console.log('\n📊 Testing HTTP Status Codes...');
  const statusTests = [
    { path: '/api/quotes/random', expectedStatus: 200, description: 'Valid request returns 200' },
    { path: '/api/quotes/by-author/NonExistentAuthor', expectedStatus: 404, description: 'Non-existent resource returns 404' },
    { path: '/api/quotes?page=0', expectedStatus: 400, description: 'Invalid parameter returns 400' },
    { path: '/api/invalid', expectedStatus: 404, description: 'Invalid endpoint returns 404' }
  ];

  for (const test of statusTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      testResults.recordTest('HTTP_COMPLIANCE', test.description, 
        response.statusCode === test.expectedStatus, 
        `Expected ${test.expectedStatus}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', test.description, false, error.message);
    }
  }

  // Test Content-Type headers
  console.log('\n📄 Testing Content-Type Headers...');
  const contentTypeTests = [
    { path: '/api/quotes/random', expectedType: 'application/json', description: 'JSON endpoint returns JSON content-type' },
    { path: '/api/authors', expectedType: 'application/json', description: 'Authors endpoint returns JSON content-type' },
    { path: '/', expectedType: 'text/html', description: 'HTML endpoint returns HTML content-type' }
  ];

  for (const test of contentTypeTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      const contentType = response.headers['content-type'] || '';
      testResults.recordTest('HTTP_COMPLIANCE', test.description, 
        contentType.includes(test.expectedType), 
        `Got: ${contentType}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', test.description, false, error.message);
    }
  }

  // Test caching headers
  console.log('\n🗄️ Testing Caching Headers...');
  try {
    const randomResponse = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('HTTP_COMPLIANCE', 'Random endpoint has no-cache headers', 
      randomResponse.headers['cache-control'] && randomResponse.headers['cache-control'].includes('no-cache'), 
      `Cache-Control: ${randomResponse.headers['cache-control']}`);

    const authorsResponse = await httpClient.makeRequest('/api/authors');
    testResults.recordTest('HTTP_COMPLIANCE', 'Static endpoint has cache headers', 
      authorsResponse.headers['cache-control'] && authorsResponse.headers['cache-control'].includes('max-age'), 
      `Cache-Control: ${authorsResponse.headers['cache-control']}`);
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'Caching headers test', false, error.message);
  }
}

module.exports = {
  testPerformanceAndLoad,
  testErrorHandlingAndEdgeCases,
  testHttpProtocolCompliance
};
