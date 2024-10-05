const express = require('express');
const app = express();

// Sample quotes data (we'll replace this with database access later)
const quotes = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { quote: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { quote: "I think, therefore I am.", author: "René Descartes" },
  { quote: "To be or not to be, that is the question.", author: "William Shakespeare" },
  { quote: "Knowledge is power.", author: "Francis Bacon" }
];

// Helper function to get a random quote
function getRandomQuote(maxLength = Infinity) {
  const filteredQuotes = quotes.filter(q => q.quote.length <= maxLength);
  return filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
}

// API route for random quotes
app.get('/api/quotes/random', (req, res) => {
  const maxLength = req.query.maxLength ? parseInt(req.query.maxLength) : Infinity;
  const quote = getRandomQuote(maxLength);
  
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
