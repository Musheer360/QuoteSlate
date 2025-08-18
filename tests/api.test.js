#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
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
          body: body,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function startServer(extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['src/index.js'], {
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('Quotes API listening')) {
        resolve(child);
      }
    });

    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    child.on('error', reject);
  });
}

function stopServer(child) {
  return new Promise((resolve) => {
    child.on('close', resolve);
    child.kill();
  });
}

async function runBasicTests(test) {
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

  const malformedCountResponse = await makeRequest('/api/quotes/random?count=10abc');
  test(
    'Malformed count parameter rejected with valid number error',
    malformedCountResponse.statusCode === 400 &&
      malformedCountResponse.body.includes('valid number')
  );

  const invalidMethodResponse = await makeRequest('/api/quotes/random', 'POST');
  test('Invalid HTTP method returns 405', invalidMethodResponse.statusCode === 405);

  const invalidPathResponse = await makeRequest('/api/quotes/invalid');
  test('Invalid API path returns 404', invalidPathResponse.statusCode === 404);

  console.log();
  console.log('Testing security headers:');
  test('X-Content-Type-Options header present', randomQuoteResponse.headers['x-content-type-options'] === 'nosniff');
  test('X-Frame-Options header present', randomQuoteResponse.headers['x-frame-options'] === 'DENY');
  test('X-XSS-Protection header present', randomQuoteResponse.headers['x-xss-protection'] === '1; mode=block');

  console.log();
}

async function testRateLimitDisabled(test) {
  const responses = [];
  for (let i = 0; i < 101; i++) {
    responses.push(await makeRequest('/api/quotes/random'));
  }
  const has429 = responses.some((r) => r.statusCode === 429);
  test('No rate limiting when ENABLE_RATE_LIMIT=false', !has429);
}

async function testRateLimitEnabled(test) {
  let rateLimited = false;
  for (let i = 0; i < 101; i++) {
    const res = await makeRequest('/api/quotes/random');
    if (res.statusCode === 429) {
      rateLimited = true;
      break;
    }
  }
  test('Rate limiting enforced when ENABLE_RATE_LIMIT=true', rateLimited);
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

  let server;
  try {
    // Execute tests with rate limiting turned off
    server = await startServer({ ENABLE_RATE_LIMIT: 'false' });
    await runBasicTests(test);
    await testRateLimitDisabled(test);
  } finally {
    if (server) {
      await stopServer(server);
    }
  }

  try {
    // Verify limiter behavior when it is enabled
    server = await startServer({ ENABLE_RATE_LIMIT: 'true' });
    await testRateLimitEnabled(test);
  } finally {
    if (server) {
      await stopServer(server);
    }
  }

  console.log();
  console.log('=== Test Summary ===');
  console.log(`${testsPassed}/${totalTests} tests passed`);

  if (testsPassed === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});
