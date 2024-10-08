const express = require('express');
const cors = require('cors');
const { sql } = require('@vercel/postgres');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Helper function to get quotes based on query parameters
async function getQuotes({ maxLength, minLength, author, authors, limit = 1 }) {
  try {
    // Build the SQL query dynamically based on provided parameters
    let baseQuery = sql`SELECT * FROM quotes WHERE 1 = 1`; // Base query to append filters

    // Apply the length filter if maxLength or minLength is provided
    if (minLength) {
      baseQuery = sql`${baseQuery} AND length >= ${minLength}`;
    }
    if (maxLength) {
      baseQuery = sql`${baseQuery} AND length <= ${maxLength}`;
    }

    // Apply the filter for a specific author (case insensitive)
    if (author) {
      baseQuery = sql`${baseQuery} AND LOWER(author) = LOWER(${author})`;
    }

    // Apply the filter for multiple authors (case insensitive)
    if (authors && authors.length > 0) {
      baseQuery = sql`${baseQuery} AND LOWER(author) = ANY(${authors.map(a => a.toLowerCase())})`;
    }

    // Apply the limit (capped at a maximum of 50 quotes)
    limit = Math.min(limit, 50); // Ensure the limit does not exceed 50
    baseQuery = sql`${baseQuery} ORDER BY RANDOM() LIMIT ${limit}`;

    // Execute the constructed query
    const result = await baseQuery;

    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// API route for random quotes with enhanced filters
app.get('/api/quotes/random', async (req, res) => {
  // Retrieve query parameters
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const author = req.query.author ? req.query.author : null;
  const authors = req.query.authors ? req.query.authors.split(',') : [];
  const limit = req.query.limit ? parseInt(req.query.limit) : 1;

  // Fetch quotes based on the provided filters
  const quotes = await getQuotes({ maxLength, minLength, author, authors, limit });

  if (quotes.length > 0) {
    res.json(quotes);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Improved home route with detailed usage instructions
app.get('/', (req, res) => {
  res.send(`
    <h1 style="text-align: center;">Welcome to QuoteSlate API by Musheer360! 📜</h1>
    <p style="font-size: 1.2em; text-align: center;">
      Use the following routes to interact with the API and retrieve inspiring quotes! ✨
    </p>
    <ul style="list-style: none; padding: 0; max-width: 800px; margin: 20px auto; text-align: left;">
      <li><strong>Get a random quote:</strong> <code>/api/quotes/random</code></li>
      <li><strong>Get quotes by max length:</strong> <code>/api/quotes/random?maxLength={character_count}</code></li>
      <li><strong>Get quotes by min length:</strong> <code>/api/quotes/random?minLength={character_count}</code></li>
      <li><strong>Get quotes within a length range:</strong> <code>/api/quotes/random?minLength={min}&maxLength={max}</code></li>
      <li><strong>Get quotes by specific author:</strong> <code>/api/quotes/random?author={author_name}</code></li>
      <li><strong>Get quotes by multiple authors:</strong> <code>/api/quotes/random?authors={author1,author2,...}</code></li>
      <li><strong>Get a specific number of quotes (max 50):</strong> <code>/api/quotes/random?limit={number}</code></li>
    </ul>
    <p style="font-size: 1em; text-align: center;">
      Example: <a href="https://quoteslate.vercel.app/api/quotes/random?minLength=30&maxLength=50" target="_blank">
      quoteslate.vercel.app/api/quotes/random?minLength=30&maxLength=50</a>
    </p>
  `);
});

module.exports = app;
