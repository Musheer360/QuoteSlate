/**
 * QuoteSlate API - Comprehensive Test Functions
 * 
 * This file contains all the individual test functions organized by category.
 * Each function is designed to test specific aspects of the API thoroughly.
 */

const { CONFIG, testResults, httpClient, DataGenerator } = require('./comprehensive.test.js');

// =============================================================================
// 1. BASIC FUNCTIONALITY TESTS
// =============================================================================

async function testBasicFunctionality() {
  console.log('\n🔧 BASIC FUNCTIONALITY TESTS');
  console.log('='.repeat(50));

  // Health endpoint
  try {
    const response = await httpClient.makeRequest('/health');
    testResults.recordTest('BASIC', 'Health endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        testResults.recordTest('BASIC', 'Health endpoint returns valid JSON', true, '', response.responseTime);
        testResults.recordTest('BASIC', 'Health status is healthy', data.status === 'healthy');
        testResults.recordTest('BASIC', 'Health endpoint has version', !!data.version);
        testResults.recordTest('BASIC', 'Health endpoint has timestamp', !!data.timestamp);
        testResults.recordTest('BASIC', 'Health endpoint has features array', Array.isArray(data.features));
      } catch (e) {
        testResults.recordTest('BASIC', 'Health endpoint returns valid JSON', false, e.message);
      }
    }
  } catch (error) {
    testResults.recordTest('BASIC', 'Health endpoint accessible', false, error.message);
  }

  // Random quote endpoint
  try {
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('BASIC', 'Random quote endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    if (response.statusCode === 200) {
      try {
        const quote = JSON.parse(response.body);
        testResults.recordTest('BASIC', 'Random quote returns valid JSON', true);
        testResults.recordTest('BASIC', 'Quote has id field', typeof quote.id === 'number');
        testResults.recordTest('BASIC', 'Quote has quote field', typeof quote.quote === 'string' && quote.quote.length > 0);
        testResults.recordTest('BASIC', 'Quote has author field', typeof quote.author === 'string' && quote.author.length > 0);
        testResults.recordTest('BASIC', 'Quote has length field', typeof quote.length === 'number');
        testResults.recordTest('BASIC', 'Quote has tags field', Array.isArray(quote.tags));
        testResults.recordTest('BASIC', 'Quote length matches text length', quote.quote.length === quote.length);
        testResults.recordTest('BASIC', 'Quote ID is positive', quote.id > 0);
        testResults.recordTest('BASIC', 'Quote length is positive', quote.length > 0);
        testResults.recordTest('BASIC', 'Tags array contains strings', quote.tags.every(tag => typeof tag === 'string'));
      } catch (e) {
        testResults.recordTest('BASIC', 'Random quote returns valid JSON', false, e.message);
      }
    }
  } catch (error) {
    testResults.recordTest('BASIC', 'Random quote endpoint accessible', false, error.message);
  }

  // Authors endpoint
  try {
    const response = await httpClient.makeRequest('/api/authors');
    testResults.recordTest('BASIC', 'Authors endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    if (response.statusCode === 200) {
      try {
        const authors = JSON.parse(response.body);
        testResults.recordTest('BASIC', 'Authors endpoint returns valid JSON', true);
        testResults.recordTest('BASIC', 'Authors is an object', typeof authors === 'object' && !Array.isArray(authors));
        testResults.recordTest('BASIC', 'Authors object has entries', Object.keys(authors).length > 0);
        
        // Check first few authors
        const authorEntries = Object.entries(authors).slice(0, 5);
        for (const [name, count] of authorEntries) {
          testResults.recordTest('BASIC', `Author "${name}" has valid count`, typeof count === 'number' && count > 0);
        }
      } catch (e) {
        testResults.recordTest('BASIC', 'Authors endpoint returns valid JSON', false, e.message);
      }
    }
  } catch (error) {
    testResults.recordTest('BASIC', 'Authors endpoint accessible', false, error.message);
  }

  // Tags endpoint
  try {
    const response = await httpClient.makeRequest('/api/tags');
    testResults.recordTest('BASIC', 'Tags endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    if (response.statusCode === 200) {
      try {
        const tags = JSON.parse(response.body);
        testResults.recordTest('BASIC', 'Tags endpoint returns valid JSON', true);
        testResults.recordTest('BASIC', 'Tags is an array', Array.isArray(tags));
        testResults.recordTest('BASIC', 'Tags array has entries', tags.length > 0);
        testResults.recordTest('BASIC', 'All tags are strings', tags.every(tag => typeof tag === 'string'));
        testResults.recordTest('BASIC', 'No empty tags', tags.every(tag => tag.length > 0));
        testResults.recordTest('BASIC', 'No duplicate tags', new Set(tags).size === tags.length);
      } catch (e) {
        testResults.recordTest('BASIC', 'Tags endpoint returns valid JSON', false, e.message);
      }
    }
  } catch (error) {
    testResults.recordTest('BASIC', 'Tags endpoint accessible', false, error.message);
  }

  // Paginated quotes endpoint
  try {
    const response = await httpClient.makeRequest('/api/quotes?page=1&limit=5');
    testResults.recordTest('BASIC', 'Paginated quotes endpoint accessible', response.statusCode === 200, '', response.responseTime);
    
    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.body);
        testResults.recordTest('BASIC', 'Paginated quotes returns valid JSON', true);
        testResults.recordTest('BASIC', 'Has data array', Array.isArray(data.data));
        testResults.recordTest('BASIC', 'Has pagination object', typeof data.pagination === 'object');
        testResults.recordTest('BASIC', 'Returns correct number of quotes', data.data.length === 5);
        testResults.recordTest('BASIC', 'Pagination has required fields', 
          data.pagination.page && data.pagination.limit && data.pagination.total && data.pagination.totalPages);
      } catch (e) {
        testResults.recordTest('BASIC', 'Paginated quotes returns valid JSON', false, e.message);
      }
    }
  } catch (error) {
    testResults.recordTest('BASIC', 'Paginated quotes endpoint accessible', false, error.message);
  }
}

// =============================================================================
// 2. PARAMETER VALIDATION TESTS (ALL EDGE CASES)
// =============================================================================

async function testParameterValidation() {
  console.log('\n🔍 PARAMETER VALIDATION TESTS');
  console.log('='.repeat(50));

  // Test count parameter validation
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
    { value: '5.00000', shouldFail: true, description: 'Count with multiple zeros' }
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

  // Test page parameter validation
  const pageTests = [
    { value: '0', shouldFail: true, description: 'Zero page' },
    { value: '-1', shouldFail: true, description: 'Negative page' },
    { value: '1', shouldFail: false, description: 'Valid page 1' },
    { value: '999999', shouldFail: false, description: 'Very high page number' },
    { value: '1.5', shouldFail: true, description: 'Decimal page' },
    { value: 'first', shouldFail: true, description: 'Text page' }
  ];

  for (const test of pageTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?page=${encodeURIComponent(test.value)}&limit=5`);
      const passed = test.shouldFail ? response.statusCode === 400 : (response.statusCode === 200 || response.statusCode === 404);
      testResults.recordTest('VALIDATION', `Page parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Page parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Test limit parameter validation
  const limitTests = [
    { value: '0', shouldFail: true, description: 'Zero limit' },
    { value: '1', shouldFail: false, description: 'Minimum valid limit' },
    { value: '100', shouldFail: false, description: 'Maximum valid limit' },
    { value: '101', shouldFail: true, description: 'Limit above maximum' },
    { value: '-5', shouldFail: true, description: 'Negative limit' }
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

  // Test length parameter validation
  const lengthTests = [
    { min: '0', max: '100', shouldFail: true, description: 'Zero minimum length' },
    { min: '10', max: '5', shouldFail: true, description: 'Min greater than max' },
    { min: '10', max: '50', shouldFail: false, description: 'Valid length range' },
    { min: '-5', max: '50', shouldFail: true, description: 'Negative minimum length' },
    { min: '10', max: '-5', shouldFail: true, description: 'Negative maximum length' },
    { min: '1.5', max: '50', shouldFail: true, description: 'Decimal minimum length' },
    { min: '10', max: '50.5', shouldFail: true, description: 'Decimal maximum length' }
  ];

  for (const test of lengthTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/random?minLength=${test.min}&maxLength=${test.max}`);
      const passed = test.shouldFail ? response.statusCode === 400 : (response.statusCode === 200 || response.statusCode === 404);
      testResults.recordTest('VALIDATION', `Length parameters: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Length parameters: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Test author parameter validation
  const authorTests = [
    { value: 'Albert Einstein', shouldFail: false, description: 'Valid author' },
    { value: 'NonExistentAuthor123', shouldFail: true, description: 'Non-existent author' },
    { value: '', shouldFail: true, description: 'Empty author' },
    { value: '   ', shouldFail: true, description: 'Whitespace-only author' },
    { value: 'a'.repeat(300), shouldFail: true, description: 'Very long author name' },
    { value: 'Albert%20Einstein', shouldFail: false, description: 'URL-encoded author' }
  ];

  for (const test of authorTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-author/${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? response.statusCode === 404 || response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Author parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Author parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Test tag parameter validation
  const tagTests = [
    { value: 'motivation', shouldFail: false, description: 'Valid tag' },
    { value: 'nonexistenttag123', shouldFail: true, description: 'Non-existent tag' },
    { value: '', shouldFail: true, description: 'Empty tag' },
    { value: '   ', shouldFail: true, description: 'Whitespace-only tag' },
    { value: 'a'.repeat(200), shouldFail: true, description: 'Very long tag' }
  ];

  for (const test of tagTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-tag/${encodeURIComponent(test.value)}`);
      const passed = test.shouldFail ? response.statusCode === 404 || response.statusCode === 400 : response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Tag parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Tag parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Test search parameter validation
  const searchTests = [
    { value: 'love', shouldFail: false, description: 'Valid search term' },
    { value: '', shouldFail: false, description: 'Empty search (should return all)' },
    { value: 'a'.repeat(600), shouldFail: true, description: 'Search term too long' },
    { value: 'test search', shouldFail: false, description: 'Multi-word search' },
    { value: '123', shouldFail: false, description: 'Numeric search' },
    { value: '!@#$%', shouldFail: false, description: 'Special characters search' }
  ];

  for (const test of searchTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(test.value)}&limit=5`);
      const passed = test.shouldFail ? response.statusCode === 400 : (response.statusCode === 200 || response.statusCode === 404);
      testResults.recordTest('VALIDATION', `Search parameter: ${test.description}`, passed, 
        `Expected ${test.shouldFail ? 'failure' : 'success'}, got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Search parameter: ${test.description}`, test.shouldFail, error.message);
    }
  }

  // Test sort parameter validation
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
      const response = await httpClient.makeRequest(`/api/quotes?sort=${encodeURIComponent(test.value)}&limit=5`);
      const passed = response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Sort parameter: ${test.description}`, passed, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Sort parameter: ${test.description}`, false, error.message);
    }
  }

  // Test order parameter validation
  const orderTests = [
    { value: 'asc', shouldFail: false, description: 'Valid ascending order' },
    { value: 'desc', shouldFail: false, description: 'Valid descending order' },
    { value: 'invalid', shouldFail: false, description: 'Invalid order (should default)' },
    { value: '', shouldFail: false, description: 'Empty order (should default)' }
  ];

  for (const test of orderTests) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?order=${encodeURIComponent(test.value)}&limit=5`);
      const passed = response.statusCode === 200;
      testResults.recordTest('VALIDATION', `Order parameter: ${test.description}`, passed, 
        `Got ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('VALIDATION', `Order parameter: ${test.description}`, false, error.message);
    }
  }
}

// =============================================================================
// 3. SECURITY VULNERABILITY TESTS
// =============================================================================

async function testSecurityVulnerabilities() {
  console.log('\n🛡️ SECURITY VULNERABILITY TESTS');
  console.log('='.repeat(50));

  // Test XSS injection attempts
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

  // Test SQL injection attempts
  console.log('\n💉 Testing SQL Injection Attempts...');
  for (const payload of CONFIG.SECURITY.SQL_INJECTION_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-author/${encodeURIComponent(payload)}`);
      const passed = response.statusCode === 400 || response.statusCode === 404;
      testResults.recordTest('SECURITY', `SQL injection blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `SQL injection blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // Test command injection attempts
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

  // Test path traversal attempts
  console.log('\n📁 Testing Path Traversal Attempts...');
  for (const payload of CONFIG.SECURITY.PATH_TRAVERSAL_PAYLOADS) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes/by-author/${encodeURIComponent(payload)}`);
      const passed = response.statusCode === 400 || response.statusCode === 404;
      testResults.recordTest('SECURITY', `Path traversal blocked: ${payload.substring(0, 30)}...`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Path traversal blocked: ${payload.substring(0, 30)}...`, true, 'Request failed (good)');
    }
  }

  // Test security headers
  console.log('\n🔒 Testing Security Headers...');
  try {
    const response = await httpClient.makeRequest('/api/quotes/random');
    testResults.recordTest('SECURITY', 'X-Content-Type-Options header present', 
      response.headers['x-content-type-options'] === 'nosniff');
    testResults.recordTest('SECURITY', 'X-Frame-Options header present', 
      response.headers['x-frame-options'] === 'DENY');
    testResults.recordTest('SECURITY', 'X-XSS-Protection header present', 
      response.headers['x-xss-protection'] === '1; mode=block');
    testResults.recordTest('SECURITY', 'Content-Type header present', 
      !!response.headers['content-type']);
  } catch (error) {
    testResults.recordTest('SECURITY', 'Security headers test', false, error.message);
  }

  // Test malicious Unicode characters
  console.log('\n🌐 Testing Malicious Unicode Characters...');
  const unicodePayloads = [
    '\u202e\u202d', // Right-to-left override
    '\ufeff', // Byte order mark
    '\u200b\u200c\u200d', // Zero-width characters
    '\u0000', // Null character
    '\u001f', // Control character
    '\u007f', // DEL character
    '\uffff', // Non-character
    String.fromCharCode(0x10000), // High Unicode
    '𝕏𝕊𝕊', // Mathematical script
    '🚀💥🎉' // Emojis
  ];

  for (const payload of unicodePayloads) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${encodeURIComponent(payload)}&limit=1`);
      const passed = response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 404;
      testResults.recordTest('SECURITY', `Unicode handling: ${payload.length} chars`, passed, 
        `Status: ${response.statusCode}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Unicode handling: ${payload.length} chars`, false, error.message);
    }
  }

  // Test HTTP header injection
  console.log('\n📡 Testing HTTP Header Injection...');
  const headerInjectionPayloads = [
    'test\r\nX-Injected: true',
    'test\nX-Injected: true',
    'test%0d%0aX-Injected: true',
    'test%0aX-Injected: true'
  ];

  for (const payload of headerInjectionPayloads) {
    try {
      const response = await httpClient.makeRequest(`/api/quotes?search=${payload}&limit=1`);
      const passed = !response.headers['x-injected'];
      testResults.recordTest('SECURITY', `Header injection blocked: ${payload.substring(0, 20)}...`, passed, 
        `Injected header present: ${!!response.headers['x-injected']}`, response.responseTime);
    } catch (error) {
      testResults.recordTest('SECURITY', `Header injection blocked: ${payload.substring(0, 20)}...`, true, 'Request failed (good)');
    }
  }
}

module.exports = {
  testBasicFunctionality,
  testParameterValidation,
  testSecurityVulnerabilities
};
