const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// Respect proxy headers so the application can resolve the original client IP
app.set("trust proxy", 1);

// Allow cross-origin requests across all routes
app.use(cors());

// Apply basic security headers to each response
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Log the client's IP address for each incoming request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Request from IP: ${req.ip}`);
  next();
});

// Configure rate limiting for abuse protection
const enableRateLimit = process.env.ENABLE_RATE_LIMIT !== "false";
if (enableRateLimit) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 100, // Maximum requests per IP for the time window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests, please try again later.",
    },
  });

  // Enforce rate limits on API routes
  app.use("/api/", apiLimiter);
}

// Load quote data at startup
const quotesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/quotes.json"), "utf8"),
);

// Load author data at startup
const authorsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/authors.json"), "utf8"),
);

// Load tag data at startup
const tagsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/tags.json"), "utf8"),
);

// Build a lookup map to normalize author names
const authorMap = {};
Object.keys(authorsData).forEach((author) => {
  authorMap[author.toLowerCase()] = author;
});

// Create a set of valid tags for quick validation
const validTagsSet = new Set(tagsData);

// Validate numeric query parameters
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

// Normalize an author string for comparison
function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
}

// Trim and validate string-based query parameters
function validateStringParam(value, paramName) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

// Determine whether a quote was written by any requested author
function hasMatchingAuthor(quote, requestedAuthors) {
  if (!requestedAuthors) return true;
  const quoteAuthor = normalizeAuthorName(quote.author);
  return requestedAuthors.some(
    (author) => normalizeAuthorName(author) === quoteAuthor,
  );
}

// Ensure a quote contains all requested tags
function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  const quoteTags = new Set(quote.tags);
  return requestedTags.every((tag) => quoteTags.has(tag));
}

// Retrieve quotes that satisfy the supplied criteria
function getQuotes({
  maxLength = null,
  minLength = null,
  tags = null,
  count = 1,
  authors = null,
} = {}) {
  let validQuotes = [...quotesData];

  // Filter by author when a list is supplied
  if (authors) {
    validQuotes = validQuotes.filter((quote) =>
      hasMatchingAuthor(quote, authors),
    );
  }

  // Filter by tags when provided
  if (tags) {
    validQuotes = validQuotes.filter((quote) => hasMatchingTags(quote, tags));
  }

  // Apply length constraints
  if (minLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length >= minLength);
  }

  if (maxLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length <= maxLength);
  }

  // Return null when no quotes remain after filtering
  if (validQuotes.length === 0) {
    return null;
  }

  // Limit the requested count to the available number of quotes
  count = Math.min(count, validQuotes.length);

  // Choose random quotes without repetition
  const quotes = [];
  const tempQuotes = [...validQuotes];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * tempQuotes.length);
    quotes.push(tempQuotes[randomIndex]);
    tempQuotes.splice(randomIndex, 1);
  }

  return quotes;
}

// Expose the list of authors and their quote counts
app.get("/api/authors", (req, res) => {
  // Respond using the preloaded author data
  res.json(authorsData);
});

// Reject non-GET methods for the authors route
app.all("/api/authors", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Expose the list of available tags
app.get("/api/tags", (req, res) => {
  // Respond using the preloaded tag data
  res.json(tagsData);
});

// Reject non-GET methods for the tags route
app.all("/api/tags", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Serve the OpenAPI specification
app.get("/api/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "../openapi.json"));
});

// Reject non-GET methods for the OpenAPI spec
app.all("/api/openapi.json", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Endpoint for retrieving random quotes
app.get("/api/quotes/random", (req, res) => {
  // Validate numeric query parameters
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

  // Parse and clean string-based query parameters
  const tagsParam = validateStringParam(req.query.tags, 'tags');
  const tags = tagsParam ? tagsParam.split(",").map((tag) => tag.toLowerCase().trim()).filter(Boolean) : null;
  
  const authorsParam = validateStringParam(req.query.authors, 'authors');
  const authors = authorsParam ? authorsParam.split(",").map((author) => author.trim()).filter(Boolean) : null;

  // Validate authors when the authors parameter is supplied
  if (authors) {
    // Use the precomputed author map for case-insensitive matching
    // Convert authors to canonical case and track invalid entries
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

      // Overwrite the authors array with normalized values
      authors.splice(0, authors.length, ...processedAuthors);
    // Author data is loaded at startup; additional error handling is unnecessary here
  }

  // Validate tags when the tags parameter is supplied
  if (tags) {
    // Use the precomputed tag set for validation
    const invalidTags = tags.filter((tag) => !validTagsSet.has(tag));
    if (invalidTags.length > 0) {
      return res.status(400).json({
        error: `Invalid tag(s): ${invalidTags.join(", ")}`,
      });
    }
    // Tag data is loaded at startup; extra error handling is not required
  }

  // Ensure minLength does not exceed maxLength
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

// Reject unsupported methods for the quotes route
app.all("/api/quotes/random", (req, res) => {
  res.status(405).json({ error: `Method ${req.method} not allowed for this endpoint.` });
});

// Serve the documentation page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Return a 404 response for any unmatched API route
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

module.exports = app;
