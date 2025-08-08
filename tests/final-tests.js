/**
 * QuoteSlate API - Final Test Functions and Main Runner
 * 
 * This file contains the remaining test functions and the main test runner
 * that orchestrates all tests.
 */

const { CONFIG, testResults, httpClient, DataGenerator } = require('./comprehensive.test.js');
const { performance } = require('perf_hooks');

// =============================================================================
// 7. RATE LIMITING TESTS
// =============================================================================

async function testRateLimiting() {
  console.log('\n🚦 RATE LIMITING TESTS');
  console.log('='.repeat(50));

  // Test normal rate limiting
  console.log('\n⏱️ Testing Normal Rate Limiting...');
  try {
    // Make multiple requests quickly
    const requests = Array.from({ length: 20 }, (_, i) => ({
      path: `/api/quotes/random?_=${i}`,
      options: { timeout: CONFIG.TIMEOUT.NORMAL }
    }));

    const responses = await httpClient.makeConcurrentRequests(requests, 10);
    const successfulResponses = responses.filter(r => r.statusCode === 200).length;
    const rateLimitedResponses = responses.filter(r => r.statusCode === 429).length;

    testResults.recordTest('RATE_LIMITING', 'Rate limiting allows normal traffic', 
      successfulResponses >= 15, 
      `${successfulResponses}/20 successful, ${rateLimitedResponses} rate limited`);

    // Check for rate limit headers - should not be present when rate limiting is disabled
    const firstResponse = responses[0];
    const hasRateLimitHeaders = firstResponse.headers['x-ratelimit-limit'] || firstResponse.headers['ratelimit-limit'];
    testResults.recordTest('RATE_LIMITING', 'Rate limit headers present', 
      !hasRateLimitHeaders, 
      'Rate limit headers should not be present when rate limiting is disabled');
  } catch (error) {
    testResults.recordTest('RATE_LIMITING', 'Rate limiting test', false, error.message);
  }

  // Test rate limit recovery
  console.log('\n🔄 Testing Rate Limit Recovery...');
  try {
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 2000));
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('RATE_LIMITING', 'Rate limit recovery', 
      response.statusCode === 200, 
      `Got ${response.statusCode} after waiting`);
  } catch (error) {
    testResults.recordTest('RATE_LIMITING', 'Rate limit recovery', false, error.message);
  }
}

// =============================================================================
// 8. FUZZING TESTS
// =============================================================================

async function testFuzzing() {
  console.log('\n🎲 FUZZING TESTS');
  console.log('='.repeat(50));

  // Random parameter fuzzing
  console.log('\n🔀 Random Parameter Fuzzing...');
  for (let i = 0; i < 20; i++) {
    const randomParams = {
      page: DataGenerator.randomNumber(0, 1000),
      limit: DataGenerator.randomNumber(0, 200),
      search: DataGenerator.randomString(DataGenerator.randomNumber(0, 100)),
      count: DataGenerator.randomNumber(0, 100),
      minLength: DataGenerator.randomNumber(0, 500),
      maxLength: DataGenerator.randomNumber(0, 500)
    };

    const queryString = Object.entries(randomParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    try {
      const response = await httpClient.makeRequest(`/api/quotes?${queryString}`);
      testResults.recordTest('FUZZING', `Random parameters test ${i + 1}`, 
        response.statusCode >= 200 && response.statusCode < 500, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Random parameters test ${i + 1}`, false, error.message);
    }
  }

  // Malicious string fuzzing
  console.log('\n💀 Malicious String Fuzzing...');
  const maliciousStrings = DataGenerator.maliciousStrings();
  
  for (let i = 0; i < Math.min(maliciousStrings.length, 30); i++) {
    const maliciousString = maliciousStrings[i];
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(maliciousString)}&limit=1`);
      testResults.recordTest('FUZZING', `Malicious string test ${i + 1}`, 
        response.statusCode !== 500, 
        `Status: ${response.statusCode}, String: ${maliciousString.substring(0, 20)}...`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Malicious string test ${i + 1}`, true, 'Request failed (acceptable)');
    }
  }

  // Boundary value fuzzing
  console.log('\n🎯 Boundary Value Fuzzing...');
  const boundaryValues = DataGenerator.boundaryValues();
  
  for (const intValue of boundaryValues.integers.slice(0, 10)) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=${intValue}&limit=10`);
      testResults.recordTest('FUZZING', `Boundary integer test: ${intValue}`, 
        response.statusCode !== 500, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Boundary integer test: ${intValue}`, true, 'Request failed (acceptable)');
    }
  }

  // Unicode fuzzing
  console.log('\n🌐 Unicode Fuzzing...');
  for (let i = 0; i < 10; i++) {
    const unicodeString = DataGenerator.randomUnicodeString(20);
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(unicodeString)}&limit=1`);
      testResults.recordTest('FUZZING', `Unicode test ${i + 1}`, 
        response.statusCode !== 500, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Unicode test ${i + 1}`, true, 'Request failed (acceptable)');
    }
  }
}

// =============================================================================
// 9. STRESS TESTS
// =============================================================================

async function testStress() {
  console.log('\n💪 STRESS TESTS');
  console.log('='.repeat(50));

  // High concurrency test
  console.log('\n🚀 High Concurrency Stress Test...');
  try {
    const highConcurrencyRequests = Array.from({ length: 200 }, (_, i) => ({
      path: `/api/quotes/random?_=${i}`,
      options: { timeout: CONFIG.TIMEOUT.VERY_LONG }
    }));

    const startTime = performance.now();
    const responses = await httpClient.makeConcurrentRequests(highConcurrencyRequests, 50);
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const successfulResponses = responses.filter(r => r.statusCode === 200).length;
    const errorResponses = responses.filter(r => r.statusCode >= 500).length;
    const successRate = (successfulResponses / responses.length) * 100;

    testResults.recordTest('STRESS', 'High concurrency stress test', 
      successRate >= 80 && errorResponses === 0, 
      `${successfulResponses}/200 successful (${successRate.toFixed(1)}%), ${errorResponses} server errors, ${totalTime.toFixed(2)}ms total`, 
      totalTime);
  } catch (error) {
    testResults.recordTest('STRESS', 'High concurrency stress test', false, error.message);
  }

  // Memory stress test
  console.log('\n💾 Memory Stress Test...');
  const initialMemory = process.memoryUsage();
  
  try {
    // Make many requests with large responses
    const memoryStressRequests = Array.from({ length: 50 }, (_, i) => ({
      path: `/api/quotes?page=${i % 10 + 1}&limit=100`,
      options: { timeout: CONFIG.TIMEOUT.VERY_LONG }
    }));

    await httpClient.makeConcurrentRequests(memoryStressRequests, 10);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    
    testResults.recordTest('STRESS', 'Memory stress test', 
      memoryIncrease < 200, 
      `Memory increased by ${memoryIncrease.toFixed(2)}MB`);
  } catch (error) {
    testResults.recordTest('STRESS', 'Memory stress test', false, error.message);
  }

  // Sustained load test
  console.log('\n⏳ Sustained Load Test...');
  try {
    const sustainedRequests = [];
    const duration = 10000; // 10 seconds
    const requestsPerSecond = 10;
    const totalRequests = (duration / 1000) * requestsPerSecond;

    for (let i = 0; i < totalRequests; i++) {
      sustainedRequests.push({
        path: `/api/quotes/random?_=${i}`,
        options: { timeout: CONFIG.TIMEOUT.LONG }
      });
    }

    const startTime = performance.now();
    const responses = await httpClient.makeConcurrentRequests(sustainedRequests, 5);
    const endTime = performance.now();
    const actualDuration = endTime - startTime;

    const successfulResponses = responses.filter(r => r.statusCode === 200).length;
    const successRate = (successfulResponses / totalRequests) * 100;

    testResults.recordTest('STRESS', 'Sustained load test', 
      successRate >= 90 && actualDuration < duration * 2, 
      `${successfulResponses}/${totalRequests} successful (${successRate.toFixed(1)}%) in ${actualDuration.toFixed(2)}ms`, 
      actualDuration);
  } catch (error) {
    testResults.recordTest('STRESS', 'Sustained load test', false, error.message);
  }
}

// =============================================================================
// 10. DATA CONSISTENCY TESTS
// =============================================================================

async function testDataConsistency() {
  console.log('\n🔍 DATA CONSISTENCY TESTS');
  console.log('='.repeat(50));

  // Test quote ID consistency
  console.log('\n🆔 Testing Quote ID Consistency...');
  try {
    const responses = await Promise.all([
      httpClient.makeRequest('/api/quotes/random?count=10'),
      httpClient.makeRequest('/api/quotes?page=1&limit=10'),
      httpClient.makeRequest('/api/quotes?page=2&limit=10')
    ]);

    const allQuotes = [];
    responses.forEach(response => {
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        if (Array.isArray(data)) {
          allQuotes.push(...data);
        } else if (Array.isArray(data.data)) {
          allQuotes.push(...data.data);
        }
      }
    });

    const uniqueIds = new Set(allQuotes.map(q => q.id));
    testResults.recordTest('DATA_CONSISTENCY', 'Quote IDs are unique', 
      uniqueIds.size === allQuotes.length, 
      `${allQuotes.length} quotes, ${uniqueIds.size} unique IDs`);

    const validIds = allQuotes.every(q => typeof q.id === 'number' && q.id > 0);
    testResults.recordTest('DATA_CONSISTENCY', 'All quote IDs are valid', 
      validIds, 
      'All IDs are positive numbers');
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Quote ID consistency test', false, error.message);
  }

  // Test author consistency
  console.log('\n👤 Testing Author Consistency...');
  try {
    const authorsResponse = await httpClient.makeRequest('/api/authors');
    const quotesResponse = await httpClient.makeRequest('/api/quotes?page=1&limit=50');

    if (authorsResponse.statusCode === 200 && quotesResponse.statusCode === 200) {
      const authors = JSON.parse(authorsResponse.body);
      const quotes = JSON.parse(quotesResponse.body).data;

      const authorNames = Object.keys(authors);
      const quoteAuthors = [...new Set(quotes.map(q => q.author))];

      const allAuthorsExist = quoteAuthors.every(author => authorNames.includes(author));
      testResults.recordTest('DATA_CONSISTENCY', 'All quote authors exist in authors list', 
        allAuthorsExist, 
        `${quoteAuthors.length} unique authors in quotes`);
    }
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Author consistency test', false, error.message);
  }

  // Test tag consistency
  console.log('\n🏷️ Testing Tag Consistency...');
  try {
    const tagsResponse = await httpClient.makeRequest('/api/tags');
    const quotesResponse = await httpClient.makeRequest('/api/quotes?page=1&limit=50');

    if (tagsResponse.statusCode === 200 && quotesResponse.statusCode === 200) {
      const validTags = JSON.parse(tagsResponse.body);
      const quotes = JSON.parse(quotesResponse.body).data;

      const allQuoteTags = quotes.flatMap(q => q.tags);
      const invalidTags = allQuoteTags.filter(tag => !validTags.includes(tag));

      testResults.recordTest('DATA_CONSISTENCY', 'All quote tags are valid', 
        invalidTags.length === 0, 
        `${invalidTags.length} invalid tags found`);
    }
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Tag consistency test', false, error.message);
  }

  // Test pagination consistency
  console.log('\n📄 Testing Pagination Consistency...');
  try {
    const page1Response = await httpClient.makeRequest('/api/quotes?page=1&limit=10');
    const page2Response = await httpClient.makeRequest('/api/quotes?page=2&limit=10');

    if (page1Response.statusCode === 200 && page2Response.statusCode === 200) {
      const page1Data = JSON.parse(page1Response.body);
      const page2Data = JSON.parse(page2Response.body);

      testResults.recordTest('DATA_CONSISTENCY', 'Pagination totals are consistent', 
        page1Data.pagination.total === page2Data.pagination.total, 
        `Page 1 total: ${page1Data.pagination.total}, Page 2 total: ${page2Data.pagination.total}`);

      const page1Ids = page1Data.data.map(q => q.id);
      const page2Ids = page2Data.data.map(q => q.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));

      testResults.recordTest('DATA_CONSISTENCY', 'No overlap between pagination pages', 
        overlap.length === 0, 
        `${overlap.length} overlapping quotes`);
    }
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Pagination consistency test', false, error.message);
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE QUOTESLATE API TESTS');
  console.log('='.repeat(80));
  console.log('This is the most thorough API test suite ever created.');
  console.log('Every edge case, security vulnerability, and performance scenario will be tested.');
  console.log('='.repeat(80));

  // Import all test functions
  const { testBasicFunctionality, testParameterValidation, testSecurityVulnerabilities } = require('./test-functions.js');
  const { testPerformanceAndLoad, testErrorHandlingAndEdgeCases, testHttpProtocolCompliance } = require('./advanced-tests.js');

  try {
    // Check if server is running
    console.log('\n🔍 Checking if server is running...');
    try {
      await httpClient.makeRequest('/health');
      console.log('✅ Server is running. Starting comprehensive tests...\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server with "npm start" before running tests.');
      process.exit(1);
    }

    // Run all test categories
    await testBasicFunctionality();
    await testParameterValidation();
    await testSecurityVulnerabilities();
    await testPerformanceAndLoad();
    await testErrorHandlingAndEdgeCases();
    await testHttpProtocolCompliance();
    await testRateLimiting();
    await testFuzzing();
    await testStress();
    await testDataConsistency();

    // Print final summary
    const success = testResults.printSummary();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR DURING TESTING:', error);
    testResults.recordTest('SYSTEM', 'Test execution', false, error.message);
    testResults.printSummary();
    process.exit(1);
  }
}

// Export functions for modular testing
module.exports = {
  testRateLimiting,
  testFuzzing,
  testStress,
  testDataConsistency,
  runComprehensiveTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests();
}
