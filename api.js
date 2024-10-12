const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const app = express();

// Trust the proxy to get the real client IP (important when deploying on platforms like Vercel)
app.set("trust proxy", 1);

// Enable CORS for all routes
app.use(cors());

// Create a rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests, please try again later.",
  },
});

// Apply rate limiting to all routes starting with /api/
app.use("/api/", apiLimiter);

// Read quotes from the JSON file
const quotesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "quotes.json"), "utf8"),
);

// Binary search function to find the index of the first quote that meets or exceeds the target length
function binarySearchLowerBound(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid].length < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return left;
}

// Helper function to get quotes based on different length criteria
function getQuote({ maxLength = null, minLength = null } = {}) {
  let start = 0;
  let end = quotesData.length - 1;

  if (minLength !== null) {
    start = binarySearchLowerBound(quotesData, minLength);
  }

  if (maxLength !== null) {
    end = binarySearchLowerBound(quotesData, maxLength + 1) - 1;
  }

  if (start > end) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * (end - start + 1)) + start;
  return quotesData[randomIndex];
}

// API route for random quotes with different length options
app.get("/api/quotes/random", (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;

  let quote;

  if (maxLength === null && minLength === null) {
    // If no length constraints, directly select a random quote
    const randomIndex = Math.floor(Math.random() * quotesData.length);
    quote = quotesData[randomIndex];
  } else {
    // Use getQuote() function for cases with length constraints
    quote = getQuote({ maxLength, minLength });
  }

  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// API route for getting quotes within a specific length range
app.get("/api/quotes/range", (req, res) => {
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;

  // Both minLength and maxLength must be provided
  if (minLength === null || maxLength === null) {
    return res
      .status(400)
      .json({ error: "Both minLength and maxLength must be provided." });
  }

  // Add this check to ensure minLength is less than or equal to maxLength
  if (minLength > maxLength) {
    return res
      .status(400)
      .json({ error: "minLength must be less than or equal to maxLength." });
  }

  const quote = getQuote({ minLength, maxLength });

  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Home Page - Serve the index.html file from the root directory
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

module.exports = app;
