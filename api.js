const express = require('express');
const cors = require('cors');
const { sql } = require('@vercel/postgres');
const path = require('path');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Helper function to get quotes based on different length criteria
async function getQuote({ maxLength = null, minLength = null } = {}) {
  try {
    let result;
    
    if (minLength && maxLength) {
      // If both minLength and maxLength are provided, get quotes within the range
      result = await sql`
        SELECT * FROM quotes
        WHERE length >= ${minLength} AND length <= ${maxLength}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else if (minLength) {
      // If only minLength is provided, get quotes with length >= minLength
      result = await sql`
        SELECT * FROM quotes
        WHERE length >= ${minLength}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else if (maxLength) {
      // If only maxLength is provided, get quotes with length <= maxLength
      result = await sql`
        SELECT * FROM quotes
        WHERE length <= ${maxLength}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else {
      // If neither is provided, select a random quote with no length filter
      result = await sql`
        SELECT * FROM quotes
        ORDER BY RANDOM()
        LIMIT 1
      `;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// API route for random quotes with different length options
app.get('/api/quotes/random', async (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  
  const quote = await getQuote({ maxLength, minLength });
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// API route for getting quotes within a specific length range
app.get('/api/quotes/range', async (req, res) => {
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;

  // Both minLength and maxLength must be provided
  if (minLength === null || maxLength === null) {
    return res.status(400).json({ error: "Both minLength and maxLength must be provided." });
  }

  const quote = await getQuote({ minLength, maxLength });

  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Home Page - Serve the index.html file from the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

module.exports = app;
