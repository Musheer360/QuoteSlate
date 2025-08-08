/**
 * QuoteSlate API - Main Application File
 * 
 * A robust, production-ready REST API for serving inspirational quotes
 * with advanced filtering, pagination, and search capabilities.
 * 
 * Features:
 * - 2,600+ curated quotes from 1,000+ authors
 * - Advanced filtering by author, tags, and length
 * - Pagination and sorting capabilities
 * - Full-text search functionality
 * - Rate limiting and security protection
 * - OpenAPI 3.0 specification
 * - Interactive Swagger documentation
 * 
 * @author Musheer Alam (Musheer360)
 * @version 2.0.0
 * @license MIT
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// =============================================================================
// CONFIGURATION FLAGS
// =============================================================================

/**
 * Configuration flags for enabling/disabling features
 * Set ENABLE_RATE_LIMITING to false for testing or development
 */
const CONFIG = {
  ENABLE_RATE_LIMITING: process.env.DISABLE_RATE_LIMITING !== 'true', // Default: enabled
  TESTING_MODE: process.env.NODE_ENV === 'test'
};

console.log(`🔧 Configuration: Rate Limiting ${CONFIG.ENABLE_RATE_LIMITING ? 'ENABLED' : 'DISABLED'}`);

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

/**
 * Configure Express to trust proxy headers for accurate client IP detection.
 * This is essential for proper rate limiting when deployed on platforms like Vercel.
 */
app.set("trust proxy", 1);

/**
 * Handle preflight OPTIONS requests before CORS middleware.
 * This ensures proper CORS handling for all cross-origin requests.
 */
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    res.status(200).end();
    return;
  }
  next();
});

/**
 * Enable Cross-Origin Resource Sharing (CORS) for all routes.
 * Configured to allow GET, HEAD, and OPTIONS methods from any origin.
 */
app.use(cors({
  origin: '*',                              // Allow requests from any origin
  methods: ['GET', 'HEAD', 'OPTIONS'],     // Restrict to safe HTTP methods
  allowedHeaders: ['Content-Type'],        // Allow only necessary headers
  maxAge: 86400                            // Cache CORS preflight for 24 hours
}));

/**
 * Apply security headers and intelligent caching strategy.
 * Different caching policies are applied based on endpoint characteristics:
 * - Random endpoints: No caching (always fresh content)
 * - Static endpoints: Short-term caching (5 minutes)
 * - Documentation: Long-term caching (1 hour)
 */
app.use((req, res, next) => {
  // Security headers to prevent common attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');    // Prevent MIME type sniffing
  res.setHeader('X-Frame-Options', 'DENY');              // Prevent clickjacking
  res.setHeader('X-XSS-Protection', '1; mode=block');    // Enable XSS protection
  
  // Intelligent caching strategy based on endpoint type
  if (req.path.startsWith('/api/')) {
    if (req.path.includes('/random')) {
      // Random endpoints should never be cached to ensure fresh content
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Static API endpoints can be cached briefly (authors, tags, paginated results)
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
    }
  } else {
    // Documentation and static content can be cached longer
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
  
  next();
});

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

/**
 * Configure rate limiting for API endpoints to prevent abuse and ensure fair usage.
 * 
 * Rate Limiting Strategy:
 * - 100 requests per 15-minute window per IP address
 * - Applies to all /api/* endpoints
 * - Uses sliding window algorithm for accurate rate limiting
 * - Includes proper headers for client awareness
 * - Skips rate limiting for static files and health checks
 * 
 * This configuration balances API accessibility with protection against abuse.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                    // 15-minute sliding window
  max: 100,                                    // Maximum 100 requests per window
  standardHeaders: true,                       // Include rate limit info in headers
  legacyHeaders: false,                        // Disable deprecated headers
  message: {
    error: "Too many requests, please try again later. Consider using the 'count' parameter to fetch multiple quotes in a single request.",
  },
  // Custom key generator for better IP detection behind proxies
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Skip rate limiting for static files and health checks
  skip: (req) => {
    return req.path === '/' || req.path.startsWith('/favicon') || req.path.startsWith('/robots');
  }
});

/**
 * Apply rate limiting middleware to all API routes (if enabled).
 * This ensures consistent rate limiting across all API endpoints.
 */
if (CONFIG.ENABLE_RATE_LIMITING) {
  app.use("/api/", apiLimiter);
  console.log('🚦 Rate limiting applied to /api/ routes');
} else {
  console.log('⚠️  Rate limiting DISABLED - not recommended for production');
}

// =============================================================================
// DATA LOADING AND CACHING
// =============================================================================

/**
 * Global data storage for quotes, authors, and tags.
 * These variables are populated lazily on first request to improve cold start performance.
 */
let quotesData, authorsData, tagsData, authorMap, validTagsSet;

/**
 * Lazy data loading function to improve application startup performance.
 * 
 * Data Loading Strategy:
 * - Loads data only when first requested (lazy loading)
 * - Caches data in memory for subsequent requests
 * - Processes raw data into optimized lookup structures
 * - Logs loading progress for monitoring
 * 
 * This approach significantly reduces cold start times on serverless platforms.
 */
function loadData() {
  if (!quotesData) {
    console.log('Loading data...');
    
    // Load quotes data from JSON file
    quotesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/quotes.json"), "utf8"),
    );
    
    // Load authors data from JSON file
    authorsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/authors.json"), "utf8"),
    );
    
    // Load tags data from JSON file
    tagsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/tags.json"), "utf8"),
    );

    // Create optimized lookup structures for better performance
    // Author map: case-insensitive author name lookup
    authorMap = {};
    Object.keys(authorsData).forEach((author) => {
      authorMap[author.toLowerCase()] = author;
    });

    // Tags set: O(1) tag validation lookup
    validTagsSet = new Set(tagsData);
    
    console.log(`Data loaded: ${quotesData.length} quotes, ${Object.keys(authorsData).length} authors, ${tagsData.length} tags`);
  }
}

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validates and normalizes pagination parameters.
 * 
 * @param {string|number} page - The requested page number
 * @param {string|number} limit - The requested items per page
 * @returns {Object} Validation result with page/limit values or error message
 * 
 * Validation Rules:
 * - Page: Must be >= 1, defaults to 1
 * - Limit: Must be 1-100, defaults to 20
 * - Returns normalized integer values
 */
function validatePaginationParams(page, limit) {
  // Validate page parameter
  const pageValidation = validateNumericParam(page, 'page', 1);
  if (pageValidation && pageValidation.error) {
    return { error: pageValidation.error };
  }
  const pageNum = pageValidation ? pageValidation.value : 1;

  // Validate limit parameter with maximum constraint
  const limitValidation = validateNumericParam(limit, 'limit', 1, 100);
  if (limitValidation && limitValidation.error) {
    return { error: limitValidation.error };
  }
  const limitNum = limitValidation ? limitValidation.value : 20;

  return { page: pageNum, limit: limitNum };
}

/**
 * Creates a standardized paginated response object.
 * 
 * @param {Array} data - The complete dataset to paginate
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items in the dataset
 * @returns {Object} Paginated response with data and pagination metadata
 * 
 * Response Structure:
 * - data: Array of items for the current page
 * - pagination: Metadata including page info, totals, and navigation flags
 */
function createPaginatedResponse(data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page: page,                              // Current page number
      limit: limit,                            // Items per page
      total: total,                            // Total items in dataset
      totalPages: totalPages,                  // Total number of pages
      hasNext: page < totalPages,              // Whether next page exists
      hasPrev: page > 1,                       // Whether previous page exists
      startIndex: startIndex + 1,              // 1-based start index for current page
      endIndex: Math.min(endIndex, total)      // 1-based end index for current page
    }
  };
}

/**
 * Optimized sorting function with caching for improved performance.
 * 
 * @param {Array} quotes - Array of quote objects to sort
 * @param {string} sort - Sort field ('id', 'author', 'length', 'random')
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted array of quotes
 * 
 * Performance Optimizations:
 * - Caches sorted results to avoid repeated sorting
 * - Uses efficient comparison functions
 * - Handles random sorting with Fisher-Yates shuffle
 */
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

/**
 * Validates and converts numeric parameters with range checking.
 * 
 * @param {string|number} value - The value to validate
 * @param {string} paramName - Name of the parameter (for error messages)
 * @param {number|null} min - Minimum allowed value (optional)
 * @param {number|null} max - Maximum allowed value (optional)
 * @returns {Object|null} Validation result with value or error message, null if value is empty
 * 
 * Validation Rules:
 * - Converts strings to integers
 * - Rejects decimal numbers (only whole numbers allowed)
 * - Enforces min/max constraints if provided
 * - Returns descriptive error messages for invalid inputs
 */
function validateNumericParam(value, paramName, min = null, max = null) {
  if (value === null || value === undefined) return null;
  
  // Convert to string for validation
  const strValue = String(value);
  
  // Reject strings that are only whitespace (including spaces, tabs, etc.) BEFORE checking for empty
  if (/^\s+$/.test(strValue)) {
    return { error: `${paramName} cannot be only whitespace.` };
  }
  
  // Handle empty strings - should return null to use defaults, not error
  if (strValue.trim() === '') {
    return null; // Allow defaults to be used
  }
  
  const trimmedValue = strValue.trim();
  
  // Reject scientific notation (e.g., 1e10, 1E5)
  if (/[eE]/.test(trimmedValue)) {
    return { error: `${paramName} must be a simple integer (scientific notation not allowed).` };
  }
  
  // Reject hexadecimal notation (e.g., 0x10, 0X10)
  if (/^0[xX]/.test(trimmedValue)) {
    return { error: `${paramName} must be a decimal integer (hexadecimal not allowed).` };
  }
  
  // Reject explicit octal notation (e.g., 0o10, 0O10) but allow plain numbers like "010"
  if (/^0[oO]/.test(trimmedValue)) {
    return { error: `${paramName} must be a decimal integer (octal notation not allowed).` };
  }
  
  // Reject binary notation (e.g., 0b10, 0B10)
  if (/^0[bB]/.test(trimmedValue)) {
    return { error: `${paramName} must be a decimal integer (binary notation not allowed).` };
  }
  
  // Check for decimal points (reject floats)
  if (trimmedValue.includes('.')) {
    return { error: `${paramName} must be a whole number.` };
  }
  
  // Parse as integer with base 10 to avoid octal interpretation
  const num = parseInt(trimmedValue, 10);
  
  // Check if parsing failed
  if (isNaN(num)) {
    return { error: `${paramName} must be a valid integer.` };
  }
  
  // For validation, check if the parsed number makes sense
  // Allow leading zeros in the input (like "010" -> 10)
  const normalizedInput = trimmedValue.replace(/^\+/, '').replace(/^0+/, '') || '0';
  if (String(num) !== normalizedInput && String(num) !== trimmedValue.replace(/^\+/, '')) {
    return { error: `${paramName} must be a valid integer.` };
  }
  
  // Check min/max constraints
  if (min !== null && num < min) {
    return { error: `${paramName} must be greater than or equal to ${min}.` };
  }
  
  if (max !== null && num > max) {
    return { error: `${paramName} must be less than or equal to ${max}.` };
  }
  
  return { value: num };
}

/**
 * Normalizes author names for case-insensitive lookup.
 * 
 * @param {string} author - The author name to normalize
 * @returns {string} Normalized author name (decoded, trimmed, lowercase)
 * 
 * This function handles URL-encoded author names and ensures consistent
 * case-insensitive matching against the author database.
 */
function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
}

/**
 * Comprehensive string parameter validation with security protection.
 * 
 * @param {string} value - The string value to validate
 * @param {string} paramName - Name of the parameter (for error messages)
 * @returns {Object|null} Validation result with sanitized value or error message
 * 
 * Security Features:
 * - Length validation to prevent DoS attacks
 * - SQL injection pattern detection
 * - XSS attack prevention
 * - JavaScript protocol blocking
 * - Dangerous character filtering
 * 
 * Parameter-specific handling:
 * - Search: More lenient, allows most punctuation
 * - Author/Tag: Strict validation with Unicode support
 * - Others: Balanced security and usability
 */
function validateStringParam(value, paramName) {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (trimmed === '') {
    return { error: `${paramName} cannot be empty.` };
  }
  
  // Length validation to prevent abuse and DoS attacks
  const maxLengths = {
    'search': 500,      // Search queries can be longer
    'author': 200,      // Author names have reasonable limits
    'tag': 100,         // Tags are typically short
    'authors': 1000,    // Multiple authors parameter
    'tags': 500         // Multiple tags parameter
  };
  
  const maxLength = maxLengths[paramName] || 200;
  if (trimmed.length > maxLength) {
    return { error: `${paramName} is too long. Maximum length is ${maxLength} characters.` };
  }
  
  // Check for potentially dangerous characters that could indicate injection attempts
  const dangerousPatterns = [
    /[<>\"'&]/,           // XSS characters
    /[;]/,                // SQL statement separators
    /--/,                 // SQL comments
    /\/\*/,               // SQL block comments
    /\*\//,               // SQL block comment end
    /union\s+select/i,    // SQL union attacks
    /drop\s+table/i,      // SQL drop table
    /delete\s+from/i,     // SQL delete
    /insert\s+into/i,     // SQL insert
    /update\s+set/i,      // SQL update
    /script/i,            // Script tags
    /javascript:/i,       // JavaScript protocol
    /vbscript:/i,         // VBScript protocol
    /on\w+\s*=/i         // Event handlers
  ];
  
  // For search parameters, be more lenient but still check for dangerous patterns
  if (paramName === 'search') {
    // Only check for the most dangerous patterns for search
    const searchDangerousPatterns = [
      /[<>]/,               // XSS angle brackets
      /script/i,            // Script tags
      /javascript:/i,       // JavaScript protocol
      /on\w+\s*=/i         // Event handlers
    ];
    
    for (const pattern of searchDangerousPatterns) {
      if (pattern.test(trimmed)) {
        return { error: `${paramName} contains potentially dangerous characters.` };
      }
    }
    
    // Remove quotes and other potentially problematic characters but allow most punctuation
    const sanitized = trimmed.replace(/[\"']/g, '');
    return { value: sanitized };
  }
  
  // For other parameters (author, tag, etc.), be more strict
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { error: `${paramName} contains invalid or potentially dangerous characters.` };
    }
  }
  
  // Additional check for author and tag parameters - only allow safe characters
  if (paramName === 'author' || paramName === 'tag') {
    // Allow letters, numbers, spaces, hyphens, apostrophes, periods, and common punctuation
    const allowedPattern = /^[a-zA-Z0-9\s\-'.,()&\u00C0-\u017F\u0100-\u024F]+$/;
    if (!allowedPattern.test(trimmed)) {
      return { error: `${paramName} contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed.` };
    }
  }
  
  return { value: trimmed };
}

// =============================================================================
// QUOTE FILTERING AND MATCHING FUNCTIONS
// =============================================================================

/**
 * Checks if a quote matches any of the requested authors.
 * 
 * @param {Object} quote - The quote object to check
 * @param {Array|null} requestedAuthors - Array of author names to match against
 * @returns {boolean} True if quote matches any requested author or no authors specified
 * 
 * Uses case-insensitive matching with normalized author names for accurate results.
 */
function hasMatchingAuthor(quote, requestedAuthors) {
  if (!requestedAuthors) return true;
  const quoteAuthor = normalizeAuthorName(quote.author);
  return requestedAuthors.some(
    (author) => normalizeAuthorName(author) === quoteAuthor,
  );
}

/**
 * Checks if a quote contains all requested tags.
 * 
 * @param {Object} quote - The quote object to check
 * @param {Array|null} requestedTags - Array of tags that must all be present
 * @returns {boolean} True if quote contains all requested tags or no tags specified
 * 
 * Uses Set-based lookup for O(1) tag checking performance.
 */
function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  const quoteTags = new Set(quote.tags);
  return requestedTags.every((tag) => quoteTags.has(tag));
}

/**
 * Optimized quote retrieval function with advanced filtering capabilities.
 * 
 * @param {Object} options - Filtering options
 * @param {number|null} options.maxLength - Maximum quote length
 * @param {number|null} options.minLength - Minimum quote length
 * @param {Array|null} options.tags - Required tags (all must be present)
 * @param {number} options.count - Number of quotes to return (default: 1)
 * @param {Array|null} options.authors - Allowed authors (any can match)
 * @returns {Array|null} Array of matching quotes or null if none found
 * 
 * Performance Optimizations:
 * - Uses reference instead of array spread for better memory usage
 * - Applies filters in order of selectivity
 * - Uses efficient random selection algorithms
 * - Avoids duplicate selection in multi-quote requests
 */
function getQuotes({
  maxLength = null,
  minLength = null,
  tags = null,
  count = 1,
  authors = null,
} = {}) {
  loadData(); // Ensure data is loaded
  
  let validQuotes = quotesData; // Use reference instead of spread for better performance

  // Apply filters efficiently in order of selectivity
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

// =============================================================================
// AUTHOR-SPECIFIC ENDPOINTS
// =============================================================================

/**
 * Get quotes by specific author with pagination support.
 * 
 * @route GET /api/quotes/by-author/:author
 * @param {string} author - Author name (URL encoded)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @returns {Object} Paginated quotes by the specified author
 * 
 * Features:
 * - Case-insensitive author matching
 * - URL decoding for author names with spaces/special characters
 * - Comprehensive input validation and sanitization
 * - Paginated results with metadata
 */
app.get("/api/quotes/by-author/:author", (req, res) => {
  loadData();
  
  // First decode the URL-encoded author parameter
  let authorParam;
  try {
    authorParam = decodeURIComponent(req.params.author);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL encoding in author parameter.' });
  }
  
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
  
  // First decode the URL-encoded tag parameter
  let tagParam;
  try {
    tagParam = decodeURIComponent(req.params.tag);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL encoding in tag parameter.' });
  }
  
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

// Robots.txt route
app.get("/robots.txt", (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, "../public/robots.txt"));
});

// Sitemap.xml route
app.get("/sitemap.xml", (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, "../public/sitemap.xml"));
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
app.get("/docs", CONFIG.ENABLE_RATE_LIMITING ? docsLimiter : (req, res, next) => next(), (req, res) => {
  res.sendFile(path.join(__dirname, "../public/docs.html"));
});

app.get("/openapi.yaml", CONFIG.ENABLE_RATE_LIMITING ? docsLimiter : (req, res, next) => next(), (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(path.join(__dirname, "../openapi.yaml"));
});

app.get("/openapi.json", CONFIG.ENABLE_RATE_LIMITING ? docsLimiter : (req, res, next) => next(), (req, res) => {
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
