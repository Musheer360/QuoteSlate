const express = require('express');
const { sql } = require('@vercel/postgres');
const app = express();

// Helper function to get a random quote
async function getRandomQuote(maxLength) {
  try {
    // If maxLength is provided and is a valid number, apply the length constraint
    const result = maxLength
      ? await sql`
        SELECT * FROM quotes
        WHERE LENGTH(quote) <= ${maxLength}
        ORDER BY RANDOM()
        LIMIT 1
      `
      : await sql`
        SELECT * FROM quotes
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
  // Parse maxLength from query string; if invalid, don't apply it
  const maxLength = parseInt(req.query.maxLength);

  // If maxLength is not a valid number, set it to `null` (to ignore the length filter)
  const validMaxLength = Number.isNaN(maxLength) ? null : maxLength;
  
  // Fetch a random quote based on the max length
  const quote = await getRandomQuote(validMaxLength);
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Default route for the API
app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API! Use /api/quotes/random to get a random quote.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
