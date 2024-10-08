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
    <!DOCTYPE html>
    <html>
    <head>
        <title>QuoteSlate API by Musheer360</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
                color: #333;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
            }
            .container {
                max-width: 800px;
                background: #ffffffdd;
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                text-align: center;
            }
            h1 {
                font-size: 2.5rem;
                color: #0056b3;
                margin-bottom: 20px;
            }
            p {
                font-size: 1.2rem;
                margin-bottom: 20px;
            }
            .endpoint {
                display: block;
                background: #e3f2fd;
                padding: 10px 20px;
                border-radius: 8px;
                border: 1px solid #90caf9;
                margin: 10px 0;
                text-decoration: none;
                color: #1e88e5;
                font-weight: bold;
                transition: 0.3s;
            }
            .endpoint:hover {
                background: #bbdefb;
                color: #0d47a1;
            }
            footer {
                margin-top: 30px;
                font-size: 0.9rem;
            }
            footer a {
                color: #0056b3;
                text-decoration: none;
                font-weight: bold;
            }
            footer a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to QuoteSlate API by Musheer360!</h1>
            <p>Explore various endpoints to get random quotes based on different criteria:</p>
            <a href="/api/quotes/random" class="endpoint">Get a Random Quote</a>
            <a href="/api/quotes/random?maxLength=50" class="endpoint">Get a Random Quote by Maximum Length</a>
            <a href="/api/quotes/random?minLength=100" class="endpoint">Get a Random Quote by Minimum Length</a>
            <a href="/api/quotes/range?minLength=50&maxLength=150" class="endpoint">Get a Random Quote by Length Range</a>
            <p>Use the <code>minLength</code> and <code>maxLength</code> query parameters to specify length limits as needed.</p>
            <footer>Created by <a href="https://github.com/Musheer360">Musheer360</a></footer>
        </div>
    </body>
    </html>
  `);
});

module.exports = app;
