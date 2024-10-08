const express = require("express");
const cors = require("cors");
const { sql } = require("@vercel/postgres");
const app = express();

app.use(cors());

async function getRandomQuote(params) {
  try {
    let query = sql`SELECT * FROM quotes WHERE 1=1`;

    if (params.minLength) {
      query.append(sql` AND length >= ${params.minLength}`);
    }
    if (params.maxLength) {
      query.append(sql` AND length <= ${params.maxLength}`);
    }
    if (params.author) {
      query.append(sql` AND LOWER(author) = LOWER(${params.author})`);
    }
    if (params.authors) {
      const authorList = params.authors
        .split(",")
        .map((a) => a.trim().toLowerCase());
      query.append(sql` AND LOWER(author) = ANY(${authorList})`);
    }

    query.append(sql` ORDER BY RANDOM() LIMIT 1`);

    const result = await query;
    return result.rows[0];
  } catch (error) {
    console.error("Database query error:", error);
    return null;
  }
}

app.get("/api/quotes/random", async (req, res) => {
  const params = {
    minLength: req.query.minLength ? parseInt(req.query.minLength) : null,
    maxLength: req.query.maxLength ? parseInt(req.query.maxLength) : null,
    author: req.query.author,
    authors: req.query.authors,
  };

  const quote = await getRandomQuote(params);

  if (quote) {
    res.json(quote);
  } else {
    res.status(404).json({ error: "No quotes found matching the criteria." });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuoteSlate API</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 10px; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Welcome to QuoteSlate API by Musheer360!</h1>
      <p>Use <code>/api/quotes/random</code> to get a random quote with the following optional parameters:</p>
      <ul>
        <li><code>minLength</code>: Minimum length of the quote</li>
        <li><code>maxLength</code>: Maximum length of the quote</li>
        <li><code>author</code>: Get a quote from a specific author (case insensitive)</li>
        <li><code>authors</code>: Get a quote from specific authors (comma-separated, case insensitive)</li>
      </ul>
      <p>Examples:</p>
      <ul>
        <li><a href="/api/quotes/random?minLength=50&maxLength=100" target="_blank">Random quote between 50 and 100 characters</a></li>
        <li><a href="/api/quotes/random?author=Albert%20Einstein" target="_blank">Random quote by Albert Einstein</a></li>
        <li><a href="/api/quotes/random?authors=Mark%20Twain,Oscar%20Wilde" target="_blank">Random quote by Mark Twain or Oscar Wilde</a></li>
        <li><a href="/api/quotes/random?minLength=100" target="_blank">Random quote with at least 100 characters</a></li>
      </ul>
    </body>
    </html>
  `);
});

module.exports = app;
