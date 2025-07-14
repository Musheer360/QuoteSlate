const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// Trust the proxy to get the real client IP
app.set("trust proxy", 1);

// Enable CORS for all routes
app.use(cors());

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add IP logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request from IP: ${req.ip}`);
  next();
});

// Rate limiter configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Load quotes data
const quotesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/quotes.json"), "utf8"),
);

// Load authors data
const authorsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/authors.json"), "utf8"),
);

// Load tags data
const tagsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/tags.json"), "utf8"),
);

// Pre-compute authorMap for efficient lookup
const authorMap = {};
Object.keys(authorsData).forEach((author) => {
  authorMap[author.toLowerCase()] = author;
});

// Pre-compute validTagsSet for efficient lookup
const validTagsSet = new Set(tagsData);

// Helper function to validate numeric parameter
function validateNumericParam(value, paramName, min = null, max = null) {
  if (value === null || value === undefined) return null;
  
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

// Helper function to normalize author names
function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
}

// Helper function to validate and sanitize string parameters
function validateStringParam(value, paramName) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

// Helper function to check if a quote's author matches any of the requested authors
function hasMatchingAuthor(quote, requestedAuthors) {
  if (!requestedAuthors) return true;
  const quoteAuthor = normalizeAuthorName(quote.author);
  return requestedAuthors.some(
    (author) => normalizeAuthorName(author) === quoteAuthor,
  );
}

// Helper function to check if a quote matches all requested tags
function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  const quoteTags = new Set(quote.tags);
  return requestedTags.every((tag) => quoteTags.has(tag));
}

// Main quote retrieval function
function getQuotes({
  maxLength = null,
  minLength = null,
  tags = null,
  count = 1,
  authors = null,
} = {}) {
  let validQuotes = [...quotesData];

  // Filter by authors if provided
  if (authors) {
    validQuotes = validQuotes.filter((quote) =>
      hasMatchingAuthor(quote, authors),
    );
  }

  // Filter by tags if provided
  if (tags) {
    validQuotes = validQuotes.filter((quote) => hasMatchingTags(quote, tags));
  }

  // Apply length filters
  if (minLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length >= minLength);
  }

  if (maxLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length <= maxLength);
  }

  // If no quotes match the criteria after all filters, return null
  if (validQuotes.length === 0) {
    return null;
  }

  // If requesting more quotes than available, return all available quotes
  count = Math.min(count, validQuotes.length);

  // Get random quotes
  const quotes = [];
  const tempQuotes = [...validQuotes];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * tempQuotes.length);
    quotes.push(tempQuotes[randomIndex]);
    tempQuotes.splice(randomIndex, 1);
  }

  return quotes;
}

// Get list of all available authors with their quote counts
app.get("/api/authors", (req, res) => {
  // Use pre-loaded authorsData
  res.json(authorsData);
});

// Handle non-GET methods for authors endpoint
app.all("/api/authors", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Get list of all available tags
app.get("/api/tags", (req, res) => {
  // Use pre-loaded tagsData
  res.json(tagsData);
});

// Handle non-GET methods for tags endpoint
app.all("/api/tags", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Main quote endpoint
app.get("/api/quotes/random", (req, res) => {
  // Validate and parse numeric parameters
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

  // Validate and parse string parameters
  const tagsParam = validateStringParam(req.query.tags, 'tags');
  const tags = tagsParam ? tagsParam.split(",").map((tag) => tag.toLowerCase().trim()).filter(Boolean) : null;
  
  const authorsParam = validateStringParam(req.query.authors, 'authors');
  const authors = authorsParam ? authorsParam.split(",").map((author) => author.trim()).filter(Boolean) : null;

  // Validate authors only if authors parameter is provided
  if (authors) {
    // Use pre-computed global authorMap
    // Check for invalid authors and convert to proper case
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

      // Replace the authors array with the properly cased versions
      authors.splice(0, authors.length, ...processedAuthors);
    // Removed catch block as authorsData is pre-loaded,
    // though other errors during processing might still occur.
    // Consider if specific error handling for author processing is needed.
  }

  // Validate tags only if tags parameter is provided
  if (tags) {
    // Use pre-computed global validTagsSet
    const invalidTags = tags.filter((tag) => !validTagsSet.has(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: `Invalid tag(s): ${invalidTags.join(", ")}`,
      });
    }
    // Removed catch block as tagsData is pre-loaded.
  }

  // Validate length parameters if both are provided
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

// Handle non-GET methods for quotes endpoint
app.all("/api/quotes/random", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Handle 404 for API routes - this should be a catch-all for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

module.exports = app;
