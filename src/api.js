const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// Trust the proxy to get the real client IP (important for Vercel)
app.set("trust proxy", 1);

// Handle OPTIONS method FIRST, before CORS middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
    return;
  }
  next();
});

// Enable CORS for all routes with optimized settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400 // 24 hours
}));

// Add security headers with smart caching optimization
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Smart caching: NO cache for random endpoints, cache for others
  if (req.path.startsWith('/api/')) {
    if (req.path.includes('/random')) {
      // Random endpoints should NEVER be cached
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Other API endpoints can be cached (authors, tags, paginated results)
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
    }
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for static content
  }
  
  next();
});

// Optimized rate limiter for Vercel
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later. Consider using the 'count' parameter to fetch multiple quotes in a single request.",
  },
  skip: (req) => {
    // Skip rate limiting for static files and health checks
    return req.path === '/' || req.path.startsWith('/favicon') || req.path.startsWith('/robots');
  }
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Lazy load data to improve cold start performance
let quotesData, authorsData, tagsData, authorMap, validTagsSet;

function loadData() {
  if (!quotesData) {
    console.log('Loading data...');
    quotesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/quotes.json"), "utf8"),
    );
    
    authorsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/authors.json"), "utf8"),
    );
    
    tagsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/tags.json"), "utf8"),
    );

    // Pre-compute maps for efficient lookup
    authorMap = {};
    Object.keys(authorsData).forEach((author) => {
      authorMap[author.toLowerCase()] = author;
    });

    validTagsSet = new Set(tagsData);
    console.log(`Data loaded: ${quotesData.length} quotes, ${Object.keys(authorsData).length} authors, ${tagsData.length} tags`);
  }
}

// Helper function to validate pagination parameters
function validatePaginationParams(page, limit) {
  const pageValidation = validateNumericParam(page, 'page', 1);
  if (pageValidation && pageValidation.error) {
    return { error: pageValidation.error };
  }
  const pageNum = pageValidation ? pageValidation.value : 1;

  const limitValidation = validateNumericParam(limit, 'limit', 1, 100);
  if (limitValidation && limitValidation.error) {
    return { error: limitValidation.error };
  }
  const limitNum = limitValidation ? limitValidation.value : 20;

  return { page: pageNum, limit: limitNum };
}

// Helper function to create pagination response
function createPaginatedResponse(data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, total)
    }
  };
}

// Optimized sorting function with memoization
const sortCache = new Map();
function sortQuotes(quotes, sort = 'id', order = 'asc') {
  const cacheKey = `${quotes.length}-${sort}-${order}`;
  
  if (sort === 'random') {
    // Don't cache random sorts
    const sortedQuotes = [...quotes];
    for (let i = sortedQuotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortedQuotes[i], sortedQuotes[j]] = [sortedQuotes[j], sortedQuotes[i]];
    }
    return sortedQuotes;
  }

  if (sortCache.has(cacheKey)) {
    return sortCache.get(cacheKey);
  }

  const sortedQuotes = [...quotes];
  
  switch (sort) {
    case 'author':
      sortedQuotes.sort((a, b) => a.author.localeCompare(b.author));
      break;
    case 'length':
      sortedQuotes.sort((a, b) => a.length - b.length);
      break;
    case 'id':
    default:
      sortedQuotes.sort((a, b) => a.id - b.id);
      break;
  }

  if (order === 'desc') {
    sortedQuotes.reverse();
  }

  // Cache the result (limit cache size)
  if (sortCache.size > 50) {
    const firstKey = sortCache.keys().next().value;
    sortCache.delete(firstKey);
  }
  sortCache.set(cacheKey, sortedQuotes);

  return sortedQuotes;
}

// Enhanced validation functions (same as before but with better error messages)
function validateNumericParam(value, paramName, min = null, max = null) {
  if (value === null || value === undefined) return null;
  
  if (typeof value === 'string' && value.trim() === '') {
    return { error: `${paramName} cannot be empty.` };
  }
  
  if (typeof value === 'string' && value.includes('.')) {
    return { error: `${paramName} must be a whole number.` };
  }
  
  const num = parseInt(value);
  if (isNaN(num)) {
    return { error: `${paramName} must be a valid number.` };
  }
  
  if (min !== null && num < min) {
    return { error: `${paramName} must be greater than or equal to ${min}.` };
  }
  
  if (max !== null && num > max) {
    return { error: `${paramName} must be less than or equal to ${max}.` };
  }
  
  return { value: num };
}

function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
}

function validateStringParam(value, paramName) {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (trimmed === '') {
    return { error: `${paramName} cannot be empty.` };
  }
  
  // For search parameters, allow more characters but sanitize dangerous ones
  if (paramName === 'search') {
    // Allow common punctuation and special characters for search
    // Only remove potentially dangerous characters for XSS prevention
    const sanitized = trimmed.replace(/[<>\"']/g, '');
    return { value: sanitized };
  }
  
  // For other parameters, be more restrictive
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  if (sanitized !== trimmed) {
    return { error: `${paramName} contains invalid characters.` };
  }
  
  return { value: trimmed };
}

function hasMatchingAuthor(quote, requestedAuthors) {
  if (!requestedAuthors) return true;
  const quoteAuthor = normalizeAuthorName(quote.author);
  return requestedAuthors.some(
    (author) => normalizeAuthorName(author) === quoteAuthor,
  );
}

function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  const quoteTags = new Set(quote.tags);
  return requestedTags.every((tag) => quoteTags.has(tag));
}

// Optimized quote retrieval function
function getQuotes({
  maxLength = null,
  minLength = null,
  tags = null,
  count = 1,
  authors = null,
} = {}) {
  loadData(); // Ensure data is loaded
  
  let validQuotes = quotesData; // Use reference instead of spread for better performance

  // Apply filters efficiently
  if (authors || tags || minLength !== null || maxLength !== null) {
    validQuotes = quotesData.filter((quote) => {
      if (authors && !hasMatchingAuthor(quote, authors)) return false;
      if (tags && !hasMatchingTags(quote, tags)) return false;
      if (minLength !== null && quote.length < minLength) return false;
      if (maxLength !== null && quote.length > maxLength) return false;
      return true;
    });
  }

  if (validQuotes.length === 0) {
    return null;
  }

  count = Math.min(count, validQuotes.length);

  // Optimized random selection
  if (count === 1) {
    return [validQuotes[Math.floor(Math.random() * validQuotes.length)]];
  }

  const quotes = [];
  const tempQuotes = [...validQuotes];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * tempQuotes.length);
    quotes.push(tempQuotes[randomIndex]);
    tempQuotes.splice(randomIndex, 1);
  }

  return quotes;
}

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['pagination', 'search', 'sorting']
  });
});

// NEW PAGINATED ENDPOINTS (optimized)

// Get all quotes with pagination
app.get("/api/quotes", (req, res) => {
  loadData();
  
  const paginationValidation = validatePaginationParams(req.query.page, req.query.limit);
  if (paginationValidation.error) {
    return res.status(400).json({ error: paginationValidation.error });
  }
  const { page, limit } = paginationValidation;

  const validSorts = ['id', 'author', 'length', 'random'];
  const sort = req.query.sort && validSorts.includes(req.query.sort) ? req.query.sort : 'id';
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  let filteredQuotes = quotesData;

  // Apply filters and search
  let tags = null;
  let authors = null;
  let searchTerm = null;

  if (req.query.tags !== undefined) {
    const tagsValidation = validateStringParam(req.query.tags, 'tags');
    if (tagsValidation && tagsValidation.error) {
      return res.status(400).json({ error: tagsValidation.error });
    }
    if (tagsValidation) {
      tags = tagsValidation.value.split(",").map((tag) => tag.toLowerCase().trim()).filter(Boolean);
    }
  }

  if (req.query.authors !== undefined) {
    const authorsValidation = validateStringParam(req.query.authors, 'authors');
    if (authorsValidation && authorsValidation.error) {
      return res.status(400).json({ error: authorsValidation.error });
    }
    if (authorsValidation) {
      authors = authorsValidation.value.split(",").map((author) => author.trim()).filter(Boolean);
    }
  }

  if (req.query.search !== undefined) {
    const searchValidation = validateStringParam(req.query.search, 'search');
    if (searchValidation && searchValidation.error) {
      return res.status(400).json({ error: searchValidation.error });
    }
    if (searchValidation) {
      searchTerm = searchValidation.value.toLowerCase();
    }
  }

  const maxLengthValidation = validateNumericParam(req.query.maxLength, 'maxLength', 1);
  if (maxLengthValidation && maxLengthValidation.error) {
    return res.status(400).json({ error: maxLengthValidation.error });
  }
  const maxLength = maxLengthValidation ? maxLengthValidation.value : null;

  const minLengthValidation = validateNumericParam(req.query.minLength, 'minLength', 1);
  if (minLengthValidation && minLengthValidation.error) {
    return res.status(400).json({ error: minLengthValidation.error });
  }
  const minLength = minLengthValidation ? minLengthValidation.value : null;

  // Validate authors and tags
  if (authors) {
    const processedAuthors = [];
    const invalidAuthors = [];

    authors.forEach((author) => {
      const lowercaseAuthor = author.toLowerCase();
      if (authorMap[lowercaseAuthor]) {
        processedAuthors.push(authorMap[lowercaseAuthor]);
      } else {
        invalidAuthors.push(author);
      }
    });

    if (invalidAuthors.length > 0) {
      return res.status(400).json({
        error: `Invalid author(s): ${invalidAuthors.join(", ")}`,
      });
    }

    authors.splice(0, authors.length, ...processedAuthors);
  }

  if (tags) {
    const invalidTags = tags.filter((tag) => !validTagsSet.has(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: `Invalid tag(s): ${invalidTags.join(", ")}`,
      });
    }
  }

  if (minLength !== null && maxLength !== null && minLength > maxLength) {
    return res.status(400).json({
      error: "minLength must be less than or equal to maxLength.",
    });
  }

  // Apply filters efficiently
  if (authors || tags || minLength !== null || maxLength !== null || searchTerm) {
    filteredQuotes = quotesData.filter((quote) => {
      if (authors && !hasMatchingAuthor(quote, authors)) return false;
      if (tags && !hasMatchingTags(quote, tags)) return false;
      if (minLength !== null && quote.length < minLength) return false;
      if (maxLength !== null && quote.length > maxLength) return false;
      if (searchTerm && 
          !quote.quote.toLowerCase().includes(searchTerm) && 
          !quote.author.toLowerCase().includes(searchTerm)) return false;
      return true;
    });
  }

  const sortedQuotes = sortQuotes(filteredQuotes, sort, order);
  const response = createPaginatedResponse(sortedQuotes, page, limit, sortedQuotes.length);

  if (response.data.length === 0 && page > 1) {
    return res.status(404).json({ error: "Page not found. No quotes available for the requested page." });
  }

  if (response.data.length === 0) {
    return res.status(404).json({ error: "No quotes found matching the criteria." });
  }

  res.json(response);
});

// Continue with other endpoints... (keeping them similar but with loadData() calls)
// I'll add the rest of the endpoints in the next part to keep this manageable

// Get quotes by specific author with pagination
app.get("/api/quotes/by-author/:author", (req, res) => {
  loadData();
  
  const authorParam = req.params.author;
  const authorValidation = validateStringParam(authorParam, 'author');
  if (authorValidation && authorValidation.error) {
    return res.status(400).json({ error: authorValidation.error });
  }

  const author = authorValidation.value;
  const lowercaseAuthor = author.toLowerCase();
  
  if (!authorMap[lowercaseAuthor]) {
    return res.status(404).json({ error: `Author "${author}" not found.` });
  }

  const properAuthorName = authorMap[lowercaseAuthor];
  const paginationValidation = validatePaginationParams(req.query.page, req.query.limit);
  if (paginationValidation.error) {
    return res.status(400).json({ error: paginationValidation.error });
  }
  const { page, limit } = paginationValidation;

  const validSorts = ['id', 'length', 'random'];
  const sort = req.query.sort && validSorts.includes(req.query.sort) ? req.query.sort : 'id';
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  const authorQuotes = quotesData.filter((quote) => quote.author === properAuthorName);
  const sortedQuotes = sortQuotes(authorQuotes, sort, order);
  const response = createPaginatedResponse(sortedQuotes, page, limit, sortedQuotes.length);

  if (response.data.length === 0 && page > 1) {
    return res.status(404).json({ error: "Page not found. No quotes available for the requested page." });
  }

  if (response.data.length === 0) {
    return res.status(404).json({ error: `No quotes found for author "${properAuthorName}".` });
  }

  res.json(response);
});

// Get quotes by specific tag with pagination
app.get("/api/quotes/by-tag/:tag", (req, res) => {
  loadData();
  
  const tagParam = req.params.tag;
  const tagValidation = validateStringParam(tagParam, 'tag');
  if (tagValidation && tagValidation.error) {
    return res.status(400).json({ error: tagValidation.error });
  }

  const tag = tagValidation.value.toLowerCase();
  
  if (!validTagsSet.has(tag)) {
    return res.status(404).json({ error: `Tag "${tag}" not found.` });
  }

  const paginationValidation = validatePaginationParams(req.query.page, req.query.limit);
  if (paginationValidation.error) {
    return res.status(400).json({ error: paginationValidation.error });
  }
  const { page, limit } = paginationValidation;

  const validSorts = ['id', 'author', 'length', 'random'];
  const sort = req.query.sort && validSorts.includes(req.query.sort) ? req.query.sort : 'id';
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  const tagQuotes = quotesData.filter((quote) => quote.tags.includes(tag));
  const sortedQuotes = sortQuotes(tagQuotes, sort, order);
  const response = createPaginatedResponse(sortedQuotes, page, limit, sortedQuotes.length);

  if (response.data.length === 0 && page > 1) {
    return res.status(404).json({ error: "Page not found. No quotes available for the requested page." });
  }

  if (response.data.length === 0) {
    return res.status(404).json({ error: `No quotes found for tag "${tag}".` });
  }

  res.json(response);
});

// Get paginated authors list
app.get("/api/authors/paginated", (req, res) => {
  loadData();
  
  const paginationValidation = validatePaginationParams(req.query.page, req.query.limit);
  if (paginationValidation.error) {
    return res.status(400).json({ error: paginationValidation.error });
  }
  const { page, limit } = paginationValidation;

  const validSorts = ['name', 'count'];
  const sort = req.query.sort && validSorts.includes(req.query.sort) ? req.query.sort : 'name';
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  let searchTerm = null;
  if (req.query.search !== undefined) {
    const searchValidation = validateStringParam(req.query.search, 'search');
    if (searchValidation && searchValidation.error) {
      return res.status(400).json({ error: searchValidation.error });
    }
    if (searchValidation) {
      searchTerm = searchValidation.value.toLowerCase();
    }
  }

  let authorsArray = Object.entries(authorsData).map(([name, count]) => ({
    name: name,
    count: count
  }));

  if (searchTerm) {
    authorsArray = authorsArray.filter(author => 
      author.name.toLowerCase().includes(searchTerm)
    );
  }

  if (sort === 'count') {
    authorsArray.sort((a, b) => a.count - b.count);
  } else {
    authorsArray.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (order === 'desc') {
    authorsArray.reverse();
  }

  const response = createPaginatedResponse(authorsArray, page, limit, authorsArray.length);

  if (response.data.length === 0 && page > 1) {
    return res.status(404).json({ error: "Page not found. No authors available for the requested page." });
  }

  if (response.data.length === 0) {
    return res.status(404).json({ error: "No authors found matching the criteria." });
  }

  res.json(response);
});

// ORIGINAL ENDPOINTS (optimized)

// Get list of all available authors with their quote counts
app.get("/api/authors", (req, res) => {
  loadData();
  res.json(authorsData);
});

// Get list of all available tags
app.get("/api/tags", (req, res) => {
  loadData();
  res.json(tagsData);
});

// Main quote endpoint (optimized)
app.get("/api/quotes/random", (req, res) => {
  loadData();
  
  const maxLengthValidation = validateNumericParam(req.query.maxLength, 'maxLength', 1);
  if (maxLengthValidation && maxLengthValidation.error) {
    return res.status(400).json({ error: maxLengthValidation.error });
  }
  const maxLength = maxLengthValidation ? maxLengthValidation.value : null;

  const minLengthValidation = validateNumericParam(req.query.minLength, 'minLength', 1);
  if (minLengthValidation && minLengthValidation.error) {
    return res.status(400).json({ error: minLengthValidation.error });
  }
  const minLength = minLengthValidation ? minLengthValidation.value : null;

  const countValidation = validateNumericParam(req.query.count, 'count', 1, 50);
  if (countValidation && countValidation.error) {
    return res.status(400).json({ error: countValidation.error });
  }
  const count = countValidation ? countValidation.value : 1;

  let tags = null;
  let authors = null;

  if (req.query.tags !== undefined) {
    const tagsValidation = validateStringParam(req.query.tags, 'tags');
    if (tagsValidation && tagsValidation.error) {
      return res.status(400).json({ error: tagsValidation.error });
    }
    if (tagsValidation) {
      tags = tagsValidation.value.split(",").map((tag) => tag.toLowerCase().trim()).filter(Boolean);
    }
  }

  if (req.query.authors !== undefined) {
    const authorsValidation = validateStringParam(req.query.authors, 'authors');
    if (authorsValidation && authorsValidation.error) {
      return res.status(400).json({ error: authorsValidation.error });
    }
    if (authorsValidation) {
      authors = authorsValidation.value.split(",").map((author) => author.trim()).filter(Boolean);
    }
  }

  if (authors) {
    const processedAuthors = [];
    const invalidAuthors = [];

    authors.forEach((author) => {
      const lowercaseAuthor = author.toLowerCase();
      if (authorMap[lowercaseAuthor]) {
        processedAuthors.push(authorMap[lowercaseAuthor]);
      } else {
        invalidAuthors.push(author);
      }
    });

    if (invalidAuthors.length > 0) {
      return res.status(400).json({
        error: `Invalid author(s): ${invalidAuthors.join(", ")}`,
      });
    }

    authors.splice(0, authors.length, ...processedAuthors);
  }

  if (tags) {
    const invalidTags = tags.filter((tag) => !validTagsSet.has(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: `Invalid tag(s): ${invalidTags.join(", ")}`,
      });
    }
  }

  if (minLength !== null && maxLength !== null && minLength > maxLength) {
    return res.status(400).json({
      error: "minLength must be less than or equal to maxLength.",
    });
  }

  const quotes = getQuotes({ maxLength, minLength, tags, count, authors });

  if (quotes) {
    res.json(count === 1 ? quotes[0] : quotes);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Handle non-GET methods for all endpoints
const endpoints = [
  "/api/quotes/random",
  "/api/quotes",
  "/api/quotes/by-author/:author",
  "/api/quotes/by-tag/:tag",
  "/api/authors",
  "/api/authors/paginated",
  "/api/tags"
];

endpoints.forEach(endpoint => {
  app.all(endpoint, (req, res) => {
    if (req.method === 'HEAD') {
      res.status(200).end();
    } else if (req.method !== 'GET') {
      res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
    }
  });
});

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Create a separate rate limiter for documentation endpoints
const docsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for documentation access (more lenient than API)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests to documentation endpoints, please try again later.",
  }
});

// API Documentation routes
app.get("/docs", docsLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/docs.html"));
});

app.get("/openapi.yaml", docsLimiter, (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(path.join(__dirname, "../openapi.yaml"));
});

app.get("/openapi.json", docsLimiter, (req, res) => {
  // Serve YAML as JSON for compatibility
  const yaml = require('fs').readFileSync(path.join(__dirname, "../openapi.yaml"), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: "OpenAPI JSON conversion not available. Please use /openapi.yaml or visit /docs for interactive documentation.",
    yaml_url: "/openapi.yaml",
    docs_url: "/docs"
  });
});

// Handle invalid API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

// Handle 404 for non-API routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = app;
