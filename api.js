const express = require('express');
const cors = require('cors'); // Import the CORS package
const { sql } = require('@vercel/postgres');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Helper function to get a random quote
async function getRandomQuote(maxLength) {
  try {
    let result;
    if (maxLength) {
      // Use the 'length' column instead of recalculating LENGTH(quote)
      result = await sql`
        SELECT * FROM quotes
        WHERE length <= ${maxLength}
        ORDER BY RANDOM()
        LIMIT 1
      `;
    } else {
      // If maxLength is not provided, select a random quote with no length filter
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

// API route for random quotes
app.get('/api/quotes/random', async (req, res) => {
  // Check if maxLength query parameter is provided
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  
  // Fetch a random quote
  const quote = await getRandomQuote(maxLength);
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send(`
    Welcome to QuoteSlate API by Musheer360!<br>
    Use <code>/api/quotes/random</code> to get a random quote.<br>
    Add <code>?maxLength={character_count}</code> to fetch a quote of a specific length by replacing <code>{character_count}</code> with the desired character count.<br>
    Example: <a href="https://quoteslate.vercel.app/api/quotes/random" target="_blank">
    quoteslate.vercel.app/api/quotes/random?maxLength=50</a>
  `);
});

module.exports = app;
