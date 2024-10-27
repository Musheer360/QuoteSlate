# QuoteSlate API

<div align="center">

![QuoteSlate API](https://img.shields.io/badge/API-QuoteSlate-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Rate Limit](https://img.shields.io/badge/rate%20limit-100%20req%2F15min-yellow)

A robust, developer-friendly API for serving inspirational and thought-provoking quotes with powerful filtering capabilities.

[Explore the API](https://quoteslate.vercel.app)

</div>

## 📚 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Quick Start](#quick-start-example)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Endpoints](#endpoints)
  - [Parameters](#parameters)
  - [Response Format](#response-format)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Technical Details](#technical-details)
- [Contributing](#contributing)
- [License](#license)

## Overview

QuoteSlate API is a lightweight, high-performance API that provides access to a curated collection of inspirational quotes. Built as an open-source RESTful service, it offers flexible filtering options, making it perfect for applications ranging from personal development apps to educational platforms.

**Base URL:** `https://quoteslate.vercel.app`

## Features

### Core Functionality
- 🎲 **Random Quote Generation**: Fetch random quotes from a diverse collection
- 📦 **Bulk Retrieval**: Get up to 50 quotes in a single request
- 🔍 **Advanced Filtering**: Filter quotes by author, length, and tags
- 📊 **Metadata Access**: Retrieve complete lists of authors and tags
- 🔄 **Real-time Updates**: Regular updates to the quote database

### Technical Features
- ⚡ **High Performance**: Optimized for quick response times
- 🛡️ **Rate Limiting**: 100 requests per 15 minutes per IP
- 🌐 **CORS Support**: Access from any origin
- 🔒 **Input Validation**: Robust parameter validation
- 📝 **Detailed Error Messages**: Clear, actionable error responses
- 🔄 **RESTful Architecture**: Clean, predictable API endpoints
- 📖 **Open Source**: Fully transparent and community-driven

## Getting Started

No API key is required. Simply make HTTP requests to the endpoints using your preferred method.

### Quick Start Example
```javascript
// Fetch a random quote
fetch('https://quoteslate.vercel.app/api/quotes/random')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Running Locally

Follow these steps to run the API on your local machine:

1. **Prerequisites**
   - Node.js (v14 or higher)
   - npm (Node Package Manager)

2. **Clone the Repository**
   ```bash
   git clone https://github.com/Musheer360/QuoteSlate.git
   cd QuoteSlate
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Required Files**
   Ensure you have the following JSON files in your root directory:
   - `quotes.json` - Contains the quotes data
   - `authors.json` - Contains author names and their quote counts
   - `tags.json` - Contains available tags

5. **Start the Server**
   ```bash
   npm start
   ```
   The API will be available at `http://localhost:3000`

6. **Development Mode**
   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Testing the Installation**
   ```bash
   curl http://localhost:3000/api/quotes/random
   ```

#### Data File Formats

Ensure your JSON files follow these formats:

`quotes.json`:
```json
[
  {
    "id": 1,
    "quote": "Quote text here",
    "author": "Author Name",
    "length": 123,
    "tags": ["tag1", "tag2"]
  }
]
```

`authors.json`:
```json
{
  "Author Name": 5,
  "Another Author": 3
}
```

`tags.json`:
```json
["motivation", "wisdom", "life"]
```

## API Reference

### Endpoints

#### 1. Random Quotes
```http
GET /api/quotes/random
```

#### 2. Author List
```http
GET /api/authors
```
Response format:
```json
{
  "Avery Brooks": 1,
  "Ayn Rand": 3,
  "Babe Ruth": 4,
  // ... more authors with their quote counts
}
```

#### 3. Tags List
```http
GET /api/tags
```
Response format:
```json
[
  "motivation",
  "inspiration",
  "life",
  "wisdom",
  // ... more tags
]
```

### Parameters

| Parameter  | Type     | Description                                          | Example                    |
|------------|----------|------------------------------------------------------|----------------------------|
| `authors`  | string   | Comma-separated list of author names                 | `authors=Babe%20Ruth,Ayn%20Rand` |
| `count`    | integer  | Number of quotes to return (1-50)                    | `count=5`                  |
| `maxLength`| integer  | Maximum character length of quotes                   | `maxLength=150`            |
| `minLength`| integer  | Minimum character length of quotes                   | `minLength=50`             |
| `tags`     | string   | Comma-separated list of tags                         | `tags=motivation,wisdom`    |

### Response Format

#### Single Quote Response
```json
{
  "id": 498,
  "quote": "Every strike brings me closer to the next home run.",
  "author": "Babe Ruth",
  "length": 51,
  "tags": ["wisdom"]
}
```

#### Multiple Quotes Response
```json
[
  {
    "id": 498,
    "quote": "Every strike brings me closer to the next home run.",
    "author": "Babe Ruth",
    "length": 51,
    "tags": ["wisdom"]
  },
  {
    "id": 120,
    "quote": "All great achievements require time.",
    "author": "Maya Angelou",
    "length": 36,
    "tags": ["motivation"]
  }
  // ... more quotes
]
```

## Usage Examples

### Basic Examples

1. **Single Random Quote**
   ```http
   GET /api/quotes/random
   ```

2. **Multiple Random Quotes**
   ```http
   GET /api/quotes/random?count=5
   ```

### Advanced Filtering

1. **Quotes by Specific Authors**
   ```http
   GET /api/quotes/random?authors=Babe%20Ruth,Maya%20Angelou&count=3
   ```

2. **Quotes with Specific Tags**
   ```http
   GET /api/quotes/random?tags=motivation,wisdom&count=2
   ```

3. **Length-Constrained Quotes**
   ```http
   GET /api/quotes/random?minLength=50&maxLength=150
   ```

4. **Combined Filters**
   ```http
   GET /api/quotes/random?authors=Babe%20Ruth&tags=wisdom&count=3&minLength=50
   ```

## Error Handling

### HTTP Status Codes

| Status Code | Description                              |
|-------------|------------------------------------------|
| 200         | Successful request                       |
| 400         | Invalid parameters or incompatible filters|
| 404         | No matching quotes found                 |
| 429         | Rate limit exceeded                      |
| 500         | Internal server error                    |

### Error Response Format
```json
{
  "error": "Detailed error message here"
}
```

### Common Error Messages

- Invalid authors:
  ```json
  {
    "error": "Invalid author(s): Unknown Author, Another Invalid"
  }
  ```

- Invalid tags:
  ```json
  {
    "error": "Invalid tag(s): invalid1, invalid2"
  }
  ```

- Count validation:
  ```json
  {
    "error": "Count must be a number between 1 and 50."
  }
  ```

## Rate Limiting

- **Limit**: 100 requests per 15 minutes
- **Scope**: Per IP address
- **Headers**: Standard rate limit headers included in responses
- **Recovery**: Limits reset automatically after the 15-minute window

## Technical Details

### Architecture
- Built with Express.js
- RESTful API design principles
- Stateless request handling
- JSON-based data storage and responses

### CORS Support
- Supports cross-origin requests from any domain
- Includes necessary CORS headers in responses
- OPTIONS requests handled automatically

### Performance Considerations
- Response times typically under 100ms
- Efficient caching of author and tag data
- Optimized random quote selection algorithm
- Proxy-aware configuration for accurate rate limiting

### Security Features
- Input sanitization and validation
- Protection against common attack vectors
- Rate limiting to prevent abuse
- Author name normalization and validation
- Tag validation against predefined list

## Contributing

QuoteSlate is open source and we welcome contributions! Please feel free to submit issues and pull requests to the repository.

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ by [Musheer360](https://github.com/Musheer360)

[⬆ Back to top](#quoteslate-api)

</div>
