const express = require('express');
const cors = require('cors'); // Import the CORS package
const { sql } = require('@vercel/postgres');
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

// Improved Home Page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>QuoteSlate API by Musheer360</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            padding: 20px;
            color: #333;
          }
          h1 {
            text-align: center;
            color: #0056b3;
          }
          .container {
            max-width: 800px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          li {
            margin: 10px 0;
          }
          a {
            text-decoration: none;
            color: #0056b3;
          }
          .endpoint {
            background: #e9f5ff;
            padding: 10px;
            border: 1px solid #d3e7fd;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to QuoteSlate API by Musheer360!</h1>
          <p>Explore various endpoints to get random quotes based on different criteria.</p>
          <ul>
            <li><b>Get a Random Quote:</b> <br>
              <span class="endpoint">/api/quotes/random</span></li>
            <li><b>Get a Random Quote by Maximum Length:</b> <br>
              <span class="endpoint">/api/quotes/random?maxLength=50</span></li>
            <li><b>Get a Random Quote by Minimum Length:</b> <br>
              <span class="endpoint">/api/quotes/random?minLength=100</span></li>
            <li><b>Get a Random Quote by Length Range:</b> <br>
              <span class="endpoint">/api/quotes/range?minLength=50&maxLength=150</span></li>
          </ul>
          <p>Use the <code>minLength</code> and <code>maxLength</code> query parameters to specify length limits as needed.</p>
          <footer style="text-align: center; margin-top: 20px;">Created by <a href="https://github.com/Musheer360">Musheer360</a></footer>
        </div>
      </body>
    </html>
  `);
});

module.exports = app;
