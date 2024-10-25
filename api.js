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
  fs.readFileSync(path.join(__dirname, "quotes.json"), "utf8"),
);

// Valid tags list
const validTags = new Set([
  "motivation",
  "inspiration",
  "life",
  "wisdom",
  "love",
  "success",
  "leadership",
  "happiness",
  "change",
  "perseverance",
  "mindfulness",
  "growth",
  "courage",
  "gratitude",
  "resilience",
  "friendship",
  "creativity",
  "humility",
  "forgiveness",
  "patience",
  "integrity",
  "self-reflection",
  "empathy",
  "purpose",
  "justice",
  "harmony",
  "knowledge",
  "hope",
  "anger",
  "fear",
  "general",
]);

// Helper function to check if a quote matches all requested tags
function hasMatchingTags(quote, requestedTags) {
  if (!requestedTags) return true;
  const quoteTags = new Set(quote.tags);
  return requestedTags.every((tag) => quoteTags.has(tag));
}

// Helper function to validate tags
function validateTags(tags) {
  return tags.every((tag) => validTags.has(tag));
}

// Main quote retrieval function
function getQuote({ maxLength = null, minLength = null, tags = null } = {}) {
  let validQuotes = [...quotesData];

  // Filter by tags if provided
  if (tags) {
    validQuotes = validQuotes.filter((quote) => hasMatchingTags(quote, tags));
  }

  // If no quotes match the tags, return null
  if (validQuotes.length === 0) {
    return null;
  }

  // Apply length filters
  if (minLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length >= minLength);
  }

  if (maxLength !== null) {
    validQuotes = validQuotes.filter((quote) => quote.length <= maxLength);
  }

  if (validQuotes.length === 0) {
    return null;
  }

  // Return a random quote from filtered list
  const randomIndex = Math.floor(Math.random() * validQuotes.length);
  return validQuotes[randomIndex];
}

// Main quote endpoint
app.get("/api/quotes/random", (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const tags = req.query.tags ? req.query.tags.split(",") : null;

  // Validate length parameters if both are provided
  if (minLength !== null && maxLength !== null && minLength > maxLength) {
    return res.status(400).json({
      error: "minLength must be less than or equal to maxLength.",
    });
  }

  // Validate tags if provided
  if (tags && !validateTags(tags)) {
    return res.status(400).json({
      error: "Invalid tags provided. Please use valid tags only.",
    });
  }

  const quote = getQuote({ maxLength, minLength, tags });

  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

module.exports = app;
