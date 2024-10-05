# QuoteSlate API

**QuoteSlate API** is a lightweight API that serves random quotes. It allows users to filter quotes based on a specified maximum length.

## Features
- **Random Quote Generation**: Retrieve a random quote from the database.
- **Length Filtering**: Get quotes that fit within a specified character limit.

## API Endpoints

### 1. Get a Random Quote
**Endpoint:**  
`GET /api/quotes/random`

**Response:**  
Returns a random quote in JSON format.

**Example Response:**
```
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
- `maxLength`: (optional) Limits the length of the quote by character count.

## Usage

- To fetch a random quote, use:  
  `/api/quotes/random`
  
- To filter by length, append the query parameter:  
  `/api/quotes/random?maxLength=50`

## License
This project is open source and available under the MIT License.
