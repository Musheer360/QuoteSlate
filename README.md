# QuoteSlate API

**QuoteSlate API** is a lightweight and versatile API that serves inspirational quotes. It allows users to retrieve random quotes and filter them based on various criteria, including length and specific ranges.

## Features

- **Random Quote Generation**: Retrieve a random quote from the database.
- **Length Filtering**: Get quotes that fit within a specified character limit.
- **Minimum Length**: Retrieve quotes with a minimum character count.
- **Range Filtering**: Get quotes within a specific length range.
- **Rate Limiting**: Protects the API from abuse with a rate limit of 100 requests per 15 minutes per IP.

## API Endpoints

### 1. Get a Random Quote

**Endpoint:**
`GET /api/quotes/random`

**Response:**
Returns a random quote in JSON format.

**Example Response:**

```json
{
  "id": 1371,
  "author": "Moncure Conway",
  "quote": "The best thing in every noble dream is the dreamer...",
  "length": 53
}
```

### 2. Get a Random Quote with Maximum Length

**Endpoint:**
`GET /api/quotes/random?maxLength={character_count}`

**Parameters:**

- `maxLength`: (optional) Limits the maximum length of the quote by character count.

### 3. Get a Random Quote with Minimum Length

**Endpoint:**
`GET /api/quotes/random?minLength={character_count}`

**Parameters:**

- `minLength`: (optional) Specifies the minimum length of the quote by character count.

### 4. Get a Random Quote within a Length Range

**Endpoint:**
`GET /api/quotes/range?minLength={min_character_count}&maxLength={max_character_count}`

**Parameters:**

- `minLength`: (required) Specifies the minimum length of the quote by character count.
- `maxLength`: (required) Specifies the maximum length of the quote by character count.

## Usage Examples

1. To fetch a random quote:

   ```
   /api/quotes/random
   ```

2. To get a quote with a maximum length of 50 characters:

   ```
   /api/quotes/random?maxLength=50
   ```

3. To retrieve a quote with a minimum length of 100 characters:

   ```
   /api/quotes/random?minLength=100
   ```

4. To get a quote within a specific length range (e.g., between 50 and 150 characters):
   ```
   /api/quotes/range?minLength=50&maxLength=150
   ```

## Error Handling

The API returns appropriate HTTP status codes along with error messages in case of invalid requests or server errors.

- 400 Bad Request: When required parameters are missing or invalid.
- 404 Not Found: When no quotes match the given criteria.
- 429 Too Many Requests: When the rate limit is exceeded.

## Rate Limiting

The API implements rate limiting to prevent abuse. Each IP address is limited to 100 requests per 15-minute window.

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS), allowing it to be accessed from any origin.

## Home Page

A simple home page is available at the root URL (`/`) which serves an `index.html` file.

## Contributions

Contributions to QuoteSlate API are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
