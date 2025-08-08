#!/usr/bin/env node

/**
 * QuoteSlate API - Basic Test Suite
 * 
 * This file contains basic integration tests for the QuoteSlate API endpoints.
 * It performs fundamental functionality testing to ensure the API is working
 * correctly after deployment or code changes.
 * 
 * Test Coverage:
 * - Health endpoint validation
 * - Random quote endpoint functionality
 * - Basic parameter validation
 * - Error handling verification
 * - Response format validation
 * 
 * Usage:
 *   node tests/api.test.js
 * 
 * Prerequisites:
 *   - API server must be running on localhost:3000
 *   - All dependencies must be installed
 * 
 * @author Musheer Alam (Musheer360)
 * @version 2.0.0
 */

const http = require('http');

// Configuration constants
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 5000; // 5 seconds timeout for each test

/**
 * Makes an HTTP request to the API and returns a promise with the response.
 * 
 * @param {string} path - The API endpoint path to request
 * @param {string} method - HTTP method (default: 'GET')
 * @returns {Promise<Object>} Promise resolving to response object with statusCode, headers, and body
 * 
 * This helper function abstracts the HTTP request logic and provides
 * consistent error handling and response parsing for all tests.
 */
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      timeout: TEST_TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      // Process complete response
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    // Handle request errors and timeouts
    req.on('error', (err) => {
      reject(err);
    });

    // Handle request timeout
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TEST_TIMEOUT}ms`));
    });

    req.end();
  });
}

// =============================================================================
// TEST EXECUTION AND REPORTING
// =============================================================================

/**
 * Test result tracking object.
 * Maintains counters for passed/failed tests and stores failure details.
 */
const testResults = {
  passed: 0,
  failed: 0,
  failures: []
};

/**
 * Assertion helper function for test validation.
 * 
 * @param {boolean} condition - The condition to test
 * @param {string} testName - Descriptive name for the test
 * @param {string} details - Additional details about the failure (optional)
 * 
 * This function provides consistent test result reporting and tracks
 * both successful and failed test cases for final summary.
 */
function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}${details ? ' - ' + details : ''}`);
    testResults.failed++;
    testResults.failures.push({ testName, details });
  }
}

/**
 * Main test execution function.
 * 
 * Runs all test cases in sequence and provides a comprehensive
 * summary of results. Tests are organized by functionality area
 * for better maintainability and debugging.
 */
async function runTests() {
  console.log('🚀 Starting QuoteSlate API Tests...\n');
  console.log('=' .repeat(50));

  try {
    // =================================================================
    // HEALTH ENDPOINT TESTS
    // =================================================================
    console.log('\n📋 Testing Health Endpoint...');
    
    const healthResponse = await makeRequest('/health');
    assert(healthResponse.statusCode === 200, 'Health endpoint returns 200 status');
    
    let healthData;
    try {
      healthData = JSON.parse(healthResponse.body);
      assert(true, 'Health endpoint returns valid JSON');
    } catch (e) {
      assert(false, 'Health endpoint returns valid JSON', e.message);
      return;
    }
    
    assert(healthData.status === 'healthy', 'Health status is "healthy"');
    assert(healthData.version === '2.0.0', 'API version is 2.0.0');
    assert(Array.isArray(healthData.features), 'Features array is present');
    assert(healthData.timestamp, 'Timestamp is present');

    // =================================================================
    // RANDOM QUOTE ENDPOINT TESTS
    // =================================================================
    console.log('\n🎲 Testing Random Quote Endpoint...');
    
    const randomResponse = await makeRequest('/api/quotes/random');
    assert(randomResponse.statusCode === 200, 'Random quote endpoint returns 200 status');
    
    let quoteData;
    try {
      quoteData = JSON.parse(randomResponse.body);
      assert(true, 'Random quote endpoint returns valid JSON');
    } catch (e) {
      assert(false, 'Random quote endpoint returns valid JSON', e.message);
      return;
    }
    
    // Validate quote structure
    assert(typeof quoteData.quote === 'string', 'Quote has text field');
    assert(typeof quoteData.author === 'string', 'Quote has author field');
    assert(Array.isArray(quoteData.tags), 'Quote has tags array');
    assert(typeof quoteData.length === 'number', 'Quote has length field');
    assert(typeof quoteData.id === 'number', 'Quote has ID field');
    assert(quoteData.quote.length === quoteData.length, 'Quote length matches text length');

    // =================================================================
    // PARAMETER VALIDATION TESTS
    // =================================================================
    console.log('\n🔧 Testing Parameter Validation...');
    
    // Test count parameter
    const multipleQuotes = await makeRequest('/api/quotes/random?count=3');
    assert(multipleQuotes.statusCode === 200, 'Multiple quotes request succeeds');
    
    let multipleData;
    try {
      multipleData = JSON.parse(multipleQuotes.body);
      assert(Array.isArray(multipleData), 'Multiple quotes returns array');
      assert(multipleData.length === 3, 'Returns correct number of quotes');
    } catch (e) {
      assert(false, 'Multiple quotes returns valid JSON', e.message);
    }
    
    // Test invalid count parameter
    const invalidCount = await makeRequest('/api/quotes/random?count=999');
    assert(invalidCount.statusCode === 400, 'Invalid count parameter rejected');

    // =================================================================
    // ERROR HANDLING TESTS
    // =================================================================
    console.log('\n⚠️  Testing Error Handling...');
    
    // Test non-existent endpoint
    const notFound = await makeRequest('/api/nonexistent');
    assert(notFound.statusCode === 404, 'Non-existent endpoint returns 404');
    
    // Test invalid author
    const invalidAuthor = await makeRequest('/api/quotes/by-author/NonexistentAuthor123');
    assert(invalidAuthor.statusCode === 404, 'Invalid author returns 404');

    // =================================================================
    // DOCUMENTATION ENDPOINT TESTS
    // =================================================================
    console.log('\n📚 Testing Documentation Endpoints...');
    
    const homePage = await makeRequest('/');
    assert(homePage.statusCode === 200, 'Home page accessible');
    
    const docsPage = await makeRequest('/docs');
    assert(docsPage.statusCode === 200, 'Documentation page accessible');
    
    const openApiSpec = await makeRequest('/openapi.yaml');
    assert(openApiSpec.statusCode === 200, 'OpenAPI specification accessible');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testResults.failed++;
    testResults.failures.push({ testName: 'Test execution', details: error.message });
  }

  // =================================================================
  // TEST RESULTS SUMMARY
  // =================================================================
  printTestSummary();
}

/**
 * Prints a comprehensive test results summary.
 * 
 * Displays:
 * - Total test counts (passed/failed)
 * - Success percentage
 * - Detailed failure information
 * - Overall test status
 */
function printTestSummary() {
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${total}`);
  console.log(`🎯 Success Rate: ${successRate}%`);

  if (testResults.failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.testName}`);
      if (failure.details) {
        console.log(`   Details: ${failure.details}`);
      }
    });
  }

  console.log('\n' + '=' .repeat(50));
  
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! API is working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the failures above.');
    process.exit(1);
  }
}

// =============================================================================
// TEST EXECUTION
// =============================================================================

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('💥 Fatal error during test execution:', error);
    process.exit(1);
  });
}

async function runTests() {
  console.log('🧪 Running QuoteSlate API Tests...\n');

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

  function testSection(title) {
    console.log(`\n📋 ${title}`);
    console.log('='.repeat(title.length + 4));
  }

  try {
    // ========================================
    // ORIGINAL ENDPOINTS TESTS
    // ========================================
    testSection('ORIGINAL ENDPOINTS (Backward Compatibility)');

    // Test random quote endpoint
    const randomQuoteResponse = await makeRequest('/api/quotes/random');
    test('Random quote endpoint returns 200', randomQuoteResponse.statusCode === 200);
    
    if (randomQuoteResponse.statusCode === 200) {
      const quote = JSON.parse(randomQuoteResponse.body);
      test('Random quote has required fields', quote.id && quote.quote && quote.author && quote.length && quote.tags);
    }

    // Test authors endpoint
    const authorsResponse = await makeRequest('/api/authors');
    test('Authors endpoint returns 200', authorsResponse.statusCode === 200);

    // Test tags endpoint
    const tagsResponse = await makeRequest('/api/tags');
    test('Tags endpoint returns 200', tagsResponse.statusCode === 200);

    // Test original filtering
    const filterResponse = await makeRequest('/api/quotes/random?count=2&authors=Albert%20Einstein');
    test('Original filtering works', filterResponse.statusCode === 200 || filterResponse.statusCode === 404);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // NEW PAGINATION ENDPOINTS TESTS
    // ========================================
    testSection('NEW PAGINATION ENDPOINTS');

    // Test paginated quotes endpoint
    const paginatedResponse = await makeRequest('/api/quotes?page=1&limit=5');
    test('Paginated quotes endpoint returns 200', paginatedResponse.statusCode === 200);
    
    if (paginatedResponse.statusCode === 200) {
      const data = JSON.parse(paginatedResponse.body);
      test('Paginated response has data array', Array.isArray(data.data));
      test('Paginated response has pagination object', data.pagination && typeof data.pagination === 'object');
      test('Returns correct number of quotes', data.data.length === 5);
    }

    // Test quotes by author
    const authorQuotesResponse = await makeRequest('/api/quotes/by-author/Albert%20Einstein?page=1&limit=3');
    test('Quotes by author endpoint works', authorQuotesResponse.statusCode === 200 || authorQuotesResponse.statusCode === 404);

    // Test quotes by tag
    const tagQuotesResponse = await makeRequest('/api/quotes/by-tag/motivation?page=1&limit=3');
    test('Quotes by tag endpoint works', tagQuotesResponse.statusCode === 200 || tagQuotesResponse.statusCode === 404);

    // Test paginated authors
    const paginatedAuthorsResponse = await makeRequest('/api/authors/paginated?page=1&limit=5');
    test('Paginated authors endpoint returns 200', paginatedAuthorsResponse.statusCode === 200);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // PARAMETER VALIDATION TESTS
    // ========================================
    testSection('PARAMETER VALIDATION');

    // Test invalid count parameter
    const invalidCountResponse = await makeRequest('/api/quotes/random?count=0');
    test('Invalid count parameter rejected', invalidCountResponse.statusCode === 400);

    // Test decimal rejection
    const decimalResponse = await makeRequest('/api/quotes/random?count=1.5');
    test('Decimal count parameter rejected', decimalResponse.statusCode === 400);

    // Test invalid page parameter
    const invalidPageResponse = await makeRequest('/api/quotes?page=0');
    test('Invalid page parameter rejected', invalidPageResponse.statusCode === 400);

    // Test invalid limit parameter
    const invalidLimitResponse = await makeRequest('/api/quotes?limit=101');
    test('Invalid limit parameter rejected', invalidLimitResponse.statusCode === 400);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // HTTP METHODS TESTS
    // ========================================
    testSection('HTTP METHODS');

    // Test HEAD method support
    const headResponse = await makeRequest('/api/quotes/random', 'HEAD');
    test('HEAD method returns 200', headResponse.statusCode === 200);

    // Test invalid HTTP method
    const invalidMethodResponse = await makeRequest('/api/quotes/random', 'POST');
    test('Invalid HTTP method returns 405', invalidMethodResponse.statusCode === 405);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // SEARCH AND SORTING TESTS
    // ========================================
    testSection('SEARCH AND SORTING');

    // Test search functionality
    const searchResponse = await makeRequest('/api/quotes?search=love&page=1&limit=3');
    test('Search functionality works', searchResponse.statusCode === 200 || searchResponse.statusCode === 404);

    // Test sorting
    const sortResponse = await makeRequest('/api/quotes?sort=length&order=desc&page=1&limit=3');
    test('Sorting functionality works', sortResponse.statusCode === 200);

    // Test author search
    const authorSearchResponse = await makeRequest('/api/authors/paginated?search=Einstein&page=1&limit=5');
    test('Author search works', authorSearchResponse.statusCode === 200 || authorSearchResponse.statusCode === 404);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // ERROR HANDLING TESTS
    // ========================================
    testSection('ERROR HANDLING');

    // Test invalid API path
    const invalidPathResponse = await makeRequest('/api/quotes/invalid');
    test('Invalid API path returns 404', invalidPathResponse.statusCode === 404);

    // Test invalid author
    const invalidAuthorResponse = await makeRequest('/api/quotes/by-author/NonExistentAuthor');
    test('Invalid author returns 404', invalidAuthorResponse.statusCode === 404);

    // Test invalid tag
    const invalidTagResponse = await makeRequest('/api/quotes/by-tag/nonexistenttag');
    test('Invalid tag returns 404', invalidTagResponse.statusCode === 404);

    await new Promise(resolve => setTimeout(resolve, 500));

    // ========================================
    // SECURITY HEADERS TESTS
    // ========================================
    testSection('SECURITY HEADERS');

    test('X-Content-Type-Options header present', randomQuoteResponse.headers['x-content-type-options'] === 'nosniff');
    test('X-Frame-Options header present', randomQuoteResponse.headers['x-frame-options'] === 'DENY');
    test('X-XSS-Protection header present', randomQuoteResponse.headers['x-xss-protection'] === '1; mode=block');

    // ========================================
    // PERFORMANCE TESTS
    // ========================================
    testSection('PERFORMANCE');

    // Test response time
    const startTime = Date.now();
    await makeRequest('/api/quotes/random');
    const responseTime = Date.now() - startTime;
    test('Response time under 1 second', responseTime < 1000);

    // Test maximum pagination limit
    const maxLimitResponse = await makeRequest('/api/quotes?page=1&limit=100');
    test('Maximum pagination limit works', maxLimitResponse.statusCode === 200);

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${totalTests - testsPassed}`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`📈 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);

    console.log('\n🧪 TESTED FEATURES:');
    console.log('='.repeat(50));
    console.log('✅ All original endpoints (backward compatibility)');
    console.log('✅ All new pagination endpoints');
    console.log('✅ Parameter validation and error handling');
    console.log('✅ HTTP method support (GET, HEAD, 405 for others)');
    console.log('✅ Search and sorting functionality');
    console.log('✅ Security headers');
    console.log('✅ Performance benchmarks');
    console.log('✅ Edge cases and invalid inputs');

    if (testsPassed === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! API is production-ready! 🚀');
      process.exit(0);
    } else {
      console.log(`\n⚠️  ${totalTests - testsPassed} tests failed. Review the issues above.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Critical error during testing:', error);
    process.exit(1);
  }
}

// Check if server is running before running tests
makeRequest('/api/quotes/random')
  .then(() => {
    console.log('🟢 Server is running. Starting comprehensive tests...\n');
    runTests();
  })
  .catch(() => {
    console.error('🔴 Server is not running. Please start the server with "npm start" before running tests.');
    process.exit(1);
  });
