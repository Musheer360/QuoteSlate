# QuoteSlate API

**QuoteSlate API** is a lightweight and versatile API that serves inspirational quotes. It allows users to retrieve random quotes and filter them based on various criteria, including authors, length, specific ranges, and tags.

## Features

- **Random Quote Generation**: Retrieve a random quote from the database.
- **Multiple Quotes**: Get multiple random quotes in a single request (up to 50).
- **Author Filtering**: Get quotes from specific authors.
- **Length Filtering**: Get quotes that fit within a specified character limit.
- **Tag Filtering**: Filter quotes by one or more tags.
- **Combinatorial Filtering**: Combine multiple filters for precise quote selection.
- **Author Lookup**: Get a list of all available authors and their quote counts.
- **Tag Lookup**: Get a list of all available tags for filtering.
- **Rate Limiting**: Protects the API from abuse with a rate limit of 100 requests per 15 minutes per IP.

## API Endpoints

### Get Available Authors

`GET /api/authors`

Returns a list of all available authors and their quote counts.

### Get Available Tags

`GET /api/tags`

Returns a list of all available tags that can be used for filtering.

### Get Quotes with Optional Filters

`GET /api/quotes/random`

**Parameters:**

- `authors`: (optional) Comma-separated list of author names
- `count`: (optional) Number of quotes to return (1-50, default: 1)
- `maxLength`: (optional) Maximum length of the quote by character count
- `minLength`: (optional) Minimum length of the quote by character count
- `tags`: (optional) Comma-separated list of tags to filter quotes

**Example Response:**

Single quote (default):

```json
{
  "id": 32,
  "quote": "Dream big and dare to fail.",
  "author": "Norman Vaughan",
  "length": 27,
  "tags": ["hope", "motivation", "inspiration"]
}
```

Multiple quotes (when count > 1):

```json
[
  {
    "id": 32,
    "quote": "Dream big and dare to fail.",
    "author": "Norman Vaughan",
    "length": 27,
    "tags": ["hope", "motivation", "inspiration"]
  },
  {
    "id": 45,
    "quote": "Another inspiring quote here.",
    "author": "Another Author",
    "length": 25,
    "tags": ["wisdom", "motivation"]
  }
]
```

## Usage Examples

1. Get available authors:

   ```
   /api/authors
   ```

2. Get available tags:

   ```
   /api/tags
   ```

3. Get a random quote:

   ```
   /api/quotes/random
   ```

4. Get multiple random quotes:

   ```
   /api/quotes/random?count=5
   ```

5. Get quotes by specific authors:

   ```
   /api/quotes/random?authors=Babe%20Ruth,Ayn%20Rand
   ```

6. Get quotes with specific tags:

   ```
   /api/quotes/random?tags=motivation,wisdom
   ```

7. Get quotes with length constraints:

   ```
   /api/quotes/random?minLength=50&maxLength=150
   ```

8. Combine multiple parameters:
   ```
   /api/quotes/random?authors=Babe%20Ruth&tags=wisdom&count=3&minLength=50&maxLength=150
   ```

## Error Handling

The API returns appropriate HTTP status codes along with error messages:

- 400 Bad Request: When parameters are invalid or incompatible
- 404 Not Found: When no quotes match the given criteria
- 429 Too Many Requests: When the rate limit is exceeded
- 500 Internal Server Error: When there's an error processing the request

Example error responses:

```json
{
  "error": "Invalid tag(s): invalid1, invalid2"
}
```

```json
{
  "error": "Invalid author(s): Unknown Author"
}
```

```json
{
  "error": "Count must be a number between 1 and 50."
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Each IP address is limited to 100 requests per 15-minute window.

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS), allowing it to be accessed from any origin.

## Home Page

A user-friendly documentation page is available at the root URL (`/`) which provides interactive examples and complete API documentation. Users can try out different API endpoints and see live responses.

## Contributions

Contributions to QuoteSlate API are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
