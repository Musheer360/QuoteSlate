const express = require('express');
const { sql } = require('@vercel/postgres');
const app = express();

// Helper function to get a random quote
async function getRandomQuote(maxLength = Infinity) {
  try {
    const result = await sql`
      SELECT * FROM quotes
      WHERE LENGTH(quote) <= ${maxLength}
      ORDER BY RANDOM()
      LIMIT 1
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// API route for random quotes
app.get('/api/quotes/random', async (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : Infinity;
  const quote = await getRandomQuote(maxLength);
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API! Use /api/quotes/random to get a random quote.');
});

module.exports = app;
