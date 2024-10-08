const express = require('express');
const cors = require('cors'); // Import the CORS package
const { sql } = require('@vercel/postgres');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Helper function to get random quotes with various filters
async function getQuotes(filters) {
  try {
    const { maxLength, minLength, author, count = 1 } = filters;
    const limit = Math.min(count, 50); // Ensure the count does not exceed 50
    let query = sql`SELECT * FROM quotes`;

    // Build the WHERE clause dynamically based on provided filters
    const conditions = [];
    if (minLength !== undefined) {
      conditions.push(sql`length >= ${minLength}`);
    }
    if (maxLength !== undefined) {
      conditions.push(sql`length <= ${maxLength}`);
    }
    if (author) {
      conditions.push(sql`LOWER(author) = LOWER(${author})`);
    }

    // If there are any conditions, add them to the query
    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    // Append ORDER BY and LIMIT clauses
    query = sql`${query} ORDER BY RANDOM() LIMIT ${limit}`;
    
    const result = await query;
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

// API route for random quotes with various filters
app.get('/api/quotes/random', async (req, res) => {
  // Parse query parameters for filters
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : undefined;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : undefined;
  const count = req.query.count ? parseInt(req.query.count) : undefined;
  const author = req.query.author ? req.query.author : undefined;

  // Validate the count parameter
  if (count && (isNaN(count) || count < 1)) {
    return res.status(400).json({ error: "Invalid 'count' parameter. It must be a positive integer." });
  }

  // Fetch quotes based on the filters
  const quotes = await getQuotes({ maxLength, minLength, author, count });

  if (quotes.length > 0) {
    res.json(quotes);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Default route with improved homepage
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to QuoteSlate API by Musheer360!</h1>
    <p>Use the following endpoints to interact with the API:</p>
    <ul>
      <li><strong>Random Quote:</strong> <code>/api/quotes/random</code> - Get a random quote.</li>
      <li><strong>Quote by Max Length:</strong> <code>/api/quotes/random?maxLength={character_count}</code> - Get a random quote with a maximum length of <code>{character_count}</code> characters.</li>
      <li><strong>Quote by Min Length:</strong> <code>/api/quotes/random?minLength={character_count}</code> - Get a random quote with at least <code>{character_count}</code> characters.</li>
      <li><strong>Quote by Length Range:</strong> <code>/api/quotes/random?minLength={min}&maxLength={max}</code> - Get a random quote with length between <code>{min}</code> and <code>{max}</code> characters.</li>
      <li><strong>Quote by Author:</strong> <code>/api/quotes/random?author={author_name}</code> - Get a random quote by the specified author (case insensitive).</li>
      <li><strong>Multiple Quotes:</strong> <code>/api/quotes/random?count={number}</code> - Get multiple random quotes. Max limit: 50.</li>
      <li><strong>Combining Filters:</strong> You can combine filters to refine your query, e.g., <code>?minLength=50&maxLength=100&author=Albert Einstein&count=5</code>.</li>
    </ul>
    <p><strong>Example:</strong> <a href="/api/quotes/random?maxLength=50">Get a random quote with a maximum length of 50 characters</a></p>
  `);
});

module.exports = app;
