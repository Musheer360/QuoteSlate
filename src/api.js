const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// Honor proxy headers so req.ip reflects the true client address
app.set("trust proxy", 1);

// Enable CORS for every route
app.use(cors());

// Log each request along with the resolved client IP (skip favicon)
app.use((req, res, next) => {
  if (req.path !== '/favicon.ico') {
    console.log(`[${new Date().toISOString()}] Request from IP: ${req.ip}`);
  }
  next();
});

// Add a few protective headers to each response
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Optional request throttling to discourage abuse
const enableRateLimit = process.env.ENABLE_RATE_LIMIT !== "false";
if (enableRateLimit) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute rolling window
    max: 100, // allow up to 100 hits per IP in that window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests, please try again later.",
    },
  });

  // Attach the limiter to all /api endpoints
  app.use("/api/", apiLimiter);
}

// Read quote data from disk during startup
const quotesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/quotes.json"), "utf8"),
);

// Read author information into memory
const authorsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/authors.json"), "utf8"),
);

// Load the list of tags once
const tagsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/tags.json"), "utf8"),
);

// Create a map to resolve lowercase author names to their canonical form
const authorMap = {};
Object.keys(authorsData).forEach((author) => {
  authorMap[author.toLowerCase()] = author;
});

// Prepare a Set for fast tag validation
const validTagsSet = new Set(tagsData);

// Safely parse numeric query parameters
function validateNumericParam(value, paramName, min = null, max = null) {
  if (value === null || value === undefined) return null;

  const valueStr = String(value).trim();
  if (!/^\d+$/.test(valueStr)) {
    return { error: `${paramName} must be a valid number.` };
  }

  const num = Number(valueStr);
  if (Number.isNaN(num)) {
    return { error: `${paramName} must be a valid integer.` };
  }

  if (min !== null && num < min) {
    return { error: `${paramName} must be greater than or equal to ${min}.` };
  }

  if (max !== null && num > max) {
    return { error: `${paramName} must be less than or equal to ${max}.` };
  }

  return { value: num };
}

// Standardize an author string for comparison
function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
}

// Clean up and verify string query parameters
function validateStringParam(value, paramName) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

// Verify that a quote includes all required tags
// requestedTags should be an array
function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  // Check if quote has all requested tags
  return requestedTags.every((tag) => quote.tags.includes(tag));
}

// Pre-compute normalized author names for all quotes for faster filtering
const normalizedQuoteAuthors = new Map();
quotesData.forEach((quote) => {
  if (quote.id != null) {
    normalizedQuoteAuthors.set(quote.id, normalizeAuthorName(quote.author));
  }
});

// Return quotes that satisfy the provided filters
function getQuotes({
  maxLength = null,
  minLength = null,
  tags = null,
  count = 1,
  authors = null,
} = {}) {
  // Pre-process authors into a Set for O(1) lookups
  const authorsSet = authors ? new Set(authors.map(normalizeAuthorName)) : null;

  // Apply all filters in a single pass for better performance
  const validQuotes = quotesData.filter((quote) => {
    // Apply author filtering using pre-computed normalized names with fallback
    if (authorsSet) {
      const normalizedAuthor = normalizedQuoteAuthors.get(quote.id) || normalizeAuthorName(quote.author);
      if (!authorsSet.has(normalizedAuthor)) {
        return false;
      }
    }

    // Apply tag filtering
    if (tags && !hasMatchingTags(quote, tags)) {
      return false;
    }

    // Apply length constraints
    if (minLength !== null && quote.length < minLength) {
      return false;
    }

    if (maxLength !== null && quote.length > maxLength) {
      return false;
    }

    return true;
  });

  // Bail out if filtering removed all quotes
  if (validQuotes.length === 0) {
    return null;
  }

  // Ensure count doesn't exceed number of available quotes
  count = Math.min(count, validQuotes.length);

  // FIX #4: Use Fisher-Yates shuffle instead of splice in loop
  const shuffled = [...validQuotes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

// Endpoint that lists authors and their quote totals
app.get("/api/authors", (req, res) => {
  // Serve the author data loaded at startup
  res.json(authorsData);
});

// Only allow GET requests on the authors endpoint
app.all("/api/authors", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Endpoint that lists all available tags
app.get("/api/tags", (req, res) => {
  // Serve the tag data loaded at startup
  res.json(tagsData);
});

// Only allow GET requests on the tags endpoint
app.all("/api/tags", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Provide the OpenAPI document
app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "../openapi.json"));
});

// Only GET is supported for the spec route
app.all("/api/openapi.json", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Route for fetching random quotes
app.get("/api/quotes/random", (req, res) => {
  // Parse and verify numeric query parameters
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

  // Split and sanitize string-based query parameters
  const tagsParam = validateStringParam(req.query.tags, 'tags');
  const tags = tagsParam ? tagsParam.split(",").map((tag) => tag.toLowerCase().trim()).filter(Boolean) : null;

  const authorsParam = validateStringParam(req.query.authors, 'authors');
  const authors = authorsParam ? authorsParam.split(",").map((author) => author.trim()).filter(Boolean) : null;

  // FIX #3: Add input length limits
  if (tags && tags.length > 20) {
    return res.status(400).json({ error: "Maximum 20 tags allowed." });
  }

  if (authors && authors.length > 20) {
    return res.status(400).json({ error: "Maximum 20 authors allowed." });
  }

  // If authors are supplied, ensure each one is recognized
  if (authors) {
    // Use authorMap for case-insensitive lookup
    // Normalize names and capture any unknown authors
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

      // Replace provided authors with their canonical forms
      authors.splice(0, authors.length, ...processedAuthors);
    // Author information is already loaded; no further checks needed
  }

  // If tags are provided, verify they are valid
  if (tags) {
    // Check each tag against the Set of known tags
    const invalidTags = tags.filter((tag) => !validTagsSet.has(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: `Invalid tag(s): ${invalidTags.join(", ")}`,
      });
    }
    // Tags are preloaded so additional validation isn't necessary
  }

  // Ensure minLength is not greater than maxLength
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

// Deny non-GET methods for the quotes endpoint
app.all("/api/quotes/random", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Deliver the documentation page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Return 404 for any other /api requests
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

module.exports = app;
