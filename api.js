const express = require('express');
const cors = require('cors'); // Import the CORS package
const { sql } = require('@vercel/postgres');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Helper function to get a random quote based on various filters
async function getRandomQuote(filters) {
  try {
    let query = sql`SELECT * FROM quotes`;
    let conditions = [];

    // If author filter is provided
    if (filters.author) {
      conditions.push(sql`author = ${filters.author}`);
    }

    // If maxLength filter is provided
    if (filters.maxLength) {
      conditions.push(sql`length <= ${filters.maxLength}`);
    }

    // If minLength filter is provided
    if (filters.minLength) {
      conditions.push(sql`length >= ${filters.minLength}`);
    }

    // Combine conditions using AND operator
    if (conditions.length > 0) {
      query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
    }

    // Randomly select one quote from the filtered results
    query = sql`${query} ORDER BY RANDOM() LIMIT 1`;

    const result = await query;
    return result.rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// API route for random quotes
app.get('/api/quotes/random', async (req, res) => {
  // Retrieve query parameters for filters
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : null;
  const minLength = req.query.minLength ? parseInt(req.query.minLength) : null;
  const author = req.query.author ? req.query.author : null;

  // Fetch a random quote using the provided filters
  const quote = await getRandomQuote({ maxLength, minLength, author });
  
  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

// Default route with improved home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuoteSlate API by Musheer360</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #fff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
        }
        h1, h2 {
          text-align: center;
          color: #4CAF50;
        }
        p {
          line-height: 1.6;
        }
        code {
          background: #f1f1f1;
          padding: 2px 6px;
          border-radius: 4px;
          color: #c7254e;
        }
        .example {
          background: #f9f9f9;
          border-left: 4px solid #4CAF50;
          padding: 10px;
          margin: 20px 0;
        }
        a {
          color: #4CAF50;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        footer {
          text-align: center;
          margin-top: 20px;
          font-size: 0.9em;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to the QuoteSlate API</h1>
        <h2>by Musheer360</h2>
        <p>This is a simple API that serves random quotes from a collection. You can retrieve quotes based on various filters like length and author.</p>
        <h3>Available Endpoints</h3>
        <ul>
          <li><code>/api/quotes/random</code> - Get a random quote.</li>
          <li><code>/api/quotes/random?maxLength={character_count}</code> - Get a random quote with a maximum length of <code>{character_count}</code> characters.</li>
          <li><code>/api/quotes/random?minLength={character_count}</code> - Get a random quote with a minimum length of <code>{character_count}</code> characters.</li>
          <li><code>/api/quotes/random?author={author_name}</code> - Get a random quote from a specific author.</li>
          <li><code>/api/quotes/random?minLength={min}&maxLength={max}</code> - Get a random quote between <code>{min}</code> and <code>{max}</code> characters long.</li>
        </ul>
        <h3>Examples</h3>
        <div class="example">
          <strong>Random Quote with a Maximum Length:</strong><br>
          <code><a href="/api/quotes/random?maxLength=50" target="_blank">/api/quotes/random?maxLength=50</a></code>
        </div>
        <div class="example">
          <strong>Random Quote from a Specific Author:</strong><br>
          <code><a href="/api/quotes/random?author=Albert%20Einstein" target="_blank">/api/quotes/random?author=Albert%20Einstein</a></code>
        </div>
        <div class="example">
          <strong>Random Quote Between 50 and 100 Characters:</strong><br>
          <code><a href="/api/quotes/random?minLength=50&maxLength=100" target="_blank">/api/quotes/random?minLength=50&maxLength=100</a></code>
        </div>
        <footer>
          Made with ❤️ by Musheer360
        </footer>
      </div>
    </body>
    </html>
  `);
});

module.exports = app;
