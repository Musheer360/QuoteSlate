# QuoteSlate API

**QuoteSlate API** is a lightweight and versatile API that serves inspirational quotes. It allows users to retrieve random quotes and filter them based on various criteria, including length and specific ranges.

## Features

- **Random Quote Generation**: Retrieve a random quote from the database.
- **Length Filtering**: Get quotes that fit within a specified character limit.
- **Minimum Length**: Retrieve quotes with a minimum character count.
- **Range Filtering**: Get quotes within a specific length range.

## API Endpoints

### 1. Get a Random Quote

**Endpoint:** 
  `GET /api/quotes/random`

**Response:** 
  Returns a random quote in JSON format.

**Example Response:**
```json
{
  "id": 248,
  "quote": "Our life is what our thoughts make it.",
  "author": "Marcus Aurelius",
  "normalized_quote": "ourlifeiswhatourthoughtsmakeit"
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
- `minLength`: Specifies the minimum length of the quote by character count.
- `maxLength`: Specifies the maximum length of the quote by character count.

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

## Rate Limiting

To ensure fair usage, the API implements rate limiting. Please refer to the response headers for your current rate limit status.

## Authentication

Currently, the API does not require authentication. However, this may change in future versions.

## Contributions

Contributions to QuoteSlate API are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For any queries or support, please open an issue on the GitHub repository.

---

Happy quoting with QuoteSlate API!
