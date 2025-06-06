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

// Helper function to normalize author names
function normalizeAuthorName(author) {
  return decodeURIComponent(author).trim().toLowerCase();
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

// Get list of all available tags
app.get("/api/tags", (req, res) => {
  // Use pre-loaded tagsData
  res.json(tagsData);
});

// Main quote endpoint
app.get("/api/quotes/random", (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const tags = req.query.tags
    ? req.query.tags.split(",").map((tag) => tag.toLowerCase())
    : null;
  const authors = req.query.authors ? req.query.authors.split(",") : null;
  const count = req.query.count ? parseInt(req.query.count) : 1;

  // Validate count parameter
  if (isNaN(count) || count < 1 || count > 50) {
    return res.status(400).json({
      error: "Count must be a number between 1 and 50.",
    });
  }

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

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = app;
