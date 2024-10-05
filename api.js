const express = require('express');
const { sql } = require('@vercel/postgres');
const app = express();

// Helper function to get a random quote
async function getRandomQuote(maxLength = 9999) {
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
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : 9999;
  const quote = await getRandomQuote(maxLength);
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Health check route to test database connectivity
app.get('/api/health-check', async (req, res) => {
  try {
    const result = await sql`SELECT 1 AS connected`;
    if (result.rows.length > 0) {
      res.json({ message: 'Database connection is successful!' });
    } else {
      res.status(500).json({ error: 'Database connection failed.' });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API! Use /api/quotes/random to get a random quote.');
});

module.exports = app;
