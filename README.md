# QuoteSlate API

**QuoteSlate API** is a lightweight and versatile API that serves inspirational quotes. It allows users to retrieve random quotes and filter them based on various criteria, including length, specific ranges, and tags.

## Features

- **Random Quote Generation**: Retrieve a random quote from the database.
- **Length Filtering**: Get quotes that fit within a specified character limit.
- **Tag Filtering**: Filter quotes by one or more tags.
- **Combinatorial Filtering**: Combine length and tag filters for precise quote selection.
- **Rate Limiting**: Protects the API from abuse with a rate limit of 100 requests per 15 minutes per IP.

## API Endpoint

### Get Quotes with Optional Filters

**Endpoint:**
`GET /api/quotes/random`

**Parameters:**

- `maxLength`: (optional) Maximum length of the quote by character count
- `minLength`: (optional) Minimum length of the quote by character count
- `tags`: (optional) Comma-separated list of tags to filter quotes

**Example Response:**

```json
{
  "id": 32,
  "quote": "Dream big and dare to fail.",
  "author": "Norman Vaughan",
  "length": 27,
  "tags": ["hope", "motivation", "inspiration"]
}
```

## Available Tags

The API supports the following tags for filtering:

- motivation
- inspiration
- life
- wisdom
- love
- success
- leadership
- happiness
- change
- perseverance
- mindfulness
- growth
- courage
- gratitude
- resilience
- friendship
- creativity
- humility
- forgiveness
- patience
- integrity
- self-reflection
- empathy
- purpose
- justice
- harmony
- knowledge
- hope
- anger
- fear
- general

## Usage Examples

1. Get a random quote:

   ```
   /api/quotes/random
   ```

2. Get a quote with specific tags:

   ```
   /api/quotes/random?tags=motivation,wisdom
   ```

3. Get a quote with maximum length:

   ```
   /api/quotes/random?maxLength=50
   ```

4. Get a quote with minimum length:

   ```
   /api/quotes/random?minLength=100
   ```

5. Get a quote within a specific length range:

   ```
   /api/quotes/random?minLength=50&maxLength=150
   ```

6. Get a quote with both tags and length constraints:
   ```
   /api/quotes/random?tags=motivation,inspiration&minLength=50&maxLength=150
   ```

## Error Handling

The API returns appropriate HTTP status codes along with error messages:

- 400 Bad Request: When parameters are invalid or incompatible
- 404 Not Found: When no quotes match the given criteria
- 429 Too Many Requests: When the rate limit is exceeded

Example error response:

```json
{
  "error": "Invalid tags provided. Please use valid tags only."
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Each IP address is limited to 100 requests per 15-minute window.

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS), allowing it to be accessed from any origin.

## Home Page

A user-friendly documentation page is available at the root URL (`/`) which provides interactive examples and complete API documentation.

## Contributions

Contributions to QuoteSlate API are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
