/**
 * QuoteSlate API - Server Entry Point
 * 
 * This file serves as the main entry point for the QuoteSlate API server.
 * It imports the configured Express application and starts the HTTP server
 * on the specified port.
 * 
 * Environment Configuration:
 * - PORT: Server port (defaults to 3000 for local development)
 * - Automatically detects deployment environment (Vercel, Heroku, etc.)
 * 
 * @author Musheer Alam (Musheer360)
 * @version 2.0.0
 */

const app = require("./api");

// Use environment PORT or default to 3000 for local development
const port = process.env.PORT || 3000;

/**
 * Start the HTTP server and listen for incoming requests.
 * 
 * The server will:
 * - Bind to the specified port
 * - Accept HTTP requests on all network interfaces
 * - Log the server URL for development convenience
 */
app.listen(port, () => {
  console.log(`Quotes API listening at http://localhost:${port}`);
});
