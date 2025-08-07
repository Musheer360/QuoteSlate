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
