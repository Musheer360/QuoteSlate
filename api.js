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
                font-family: 'Arial', sans-serif;
                background-color: #f7f9fc;
                color: #333;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .container {
                width: 60%;
                max-width: 900px;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 2.2rem;
                color: #0056b3;
                margin-bottom: 20px;
                text-align: center;
            }
            h2 {
                font-size: 1.5rem;
                margin-top: 30px;
                color: #444;
                border-bottom: 2px solid #0056b3;
                padding-bottom: 5px;
            }
            p, li {
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 10px;
            }
            ul {
                padding-left: 20px;
            }
            code {
                background-color: #f3f4f6;
                padding: 4px 6px;
                border-radius: 5px;
                font-size: 0.95rem;
                color: #d63384;
            }
            .endpoint {
                display: inline-block;
                margin: 8px 0;
                background: #e7f1ff;
                padding: 8px 16px;
                border: 1px solid #b0d1ff;
                border-radius: 5px;
                text-decoration: none;
                color: #0056b3;
                font-weight: bold;
                transition: 0.3s;
            }
            .endpoint:hover {
                background: #cfe2ff;
                color: #00409e;
            }
            footer {
                text-align: center;
                margin-top: 30px;
                font-size: 0.9rem;
                color: #555;
            }
            footer a {
                color: #d63384;
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
            <p>This API allows you to retrieve random quotes and filter them based on their length. Explore the available endpoints and parameters below to make full use of the API.</p>
            
            <h2>API Endpoints</h2>
            <p>Use the following endpoints to fetch quotes:</p>
            <ul>
                <li><code>GET /api/quotes/random</code> - Retrieves a random quote.</li>
                <li><code>GET /api/quotes/random?maxLength={number}</code> - Retrieves a random quote with a maximum character length.</li>
                <li><code>GET /api/quotes/random?minLength={number}</code> - Retrieves a random quote with a minimum character length.</li>
                <li><code>GET /api/quotes/range?minLength={number}&maxLength={number}</code> - Retrieves a random quote within the specified length range.</li>
            </ul>

            <h2>Parameters</h2>
            <p>You can use the following query parameters to filter quotes based on length:</p>
            <ul>
                <li><code>maxLength</code> - Integer value specifying the maximum length of the quote.</li>
                <li><code>minLength</code> - Integer value specifying the minimum length of the quote.</li>
            </ul>

            <h2>Examples</h2>
            <p>Here are some example queries you can try:</p>
            <ul>
                <li><a href="/api/quotes/random" class="endpoint">Get a Random Quote</a></li>
                <li><a href="/api/quotes/random?maxLength=50" class="endpoint">Get a Random Quote with Max Length of 50</a></li>
                <li><a href="/api/quotes/random?minLength=100" class="endpoint">Get a Random Quote with Min Length of 100</a></li>
                <li><a href="/api/quotes/range?minLength=50&maxLength=150" class="endpoint">Get a Random Quote within Length Range 50-150</a></li>
            </ul>

            <footer>
                Made with ❤️ by <a href="https://github.com/Musheer360" target="_blank">Musheer360</a>
            </footer>
        </div>
    </body>
    </html>
  `);
});

module.exports = app;
