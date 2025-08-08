<h1 align="center">QuoteSlate API</h1>

<div align="center">

![QuoteSlate API](https://img.shields.io/badge/API-QuoteSlate-blue)
![API Status](https://img.shields.io/website?url=https%3A%2F%2Fquoteslate.vercel.app%2Fapi%2Fquotes%2Frandom&label=API%20Status)
![License](https://img.shields.io/badge/license-MIT-green)
![Rate Limit](https://img.shields.io/badge/rate%20limit-100%20req%2F15min-yellow)

A robust, developer-friendly API for serving inspirational and thought-provoking quotes with powerful filtering capabilities.

[Explore the API](https://quoteslate.vercel.app) | [Documentation](https://github.com/Musheer360/QuoteSlate#api-reference) | [Deploy Your Own](https://github.com/Musheer360/QuoteSlate#deploying-on-vercel-easiest-for-high-volume-needs)

</div>

## 📚 Table of Contents

- [Overview](#overview)
- [Using QuoteSlate Responsibly](#using-quoteslate-responsibly)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Quick Start](#quick-start-example)
  - [Deploying on Vercel (Easiest for High-Volume Needs)](#deploying-on-vercel-easiest-for-high-volume-needs)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
  - [Endpoints](#endpoints)
  - [Parameters](#parameters)
  - [Response Format](#response-format)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Technical Details](#technical-details)
- [Testing](#testing)
- [Contributing](#contributing)
- [Projects Using QuoteSlate](#projects-using-quoteslate)
- [License](#license)

## Overview

QuoteSlate API is a lightweight, high-performance API that provides access to a curated collection of inspirational quotes. Built as an open-source RESTful service, it offers flexible filtering options, making it perfect for applications ranging from personal development apps to educational platforms.

**Base URL:** `https://quoteslate.vercel.app`

## Using QuoteSlate Responsibly

The QuoteSlate API is a labor of love, provided free of charge to support the developer community. My goal is to keep it open and accessible to everyone, especially for hobby projects and creative applications. It's currently hosted on Vercel's free plan, which generously provides resources for small-scale projects. However, to ensure its long-term sustainability for everyone, I ask for your cooperation in using the API responsibly.

**Here's how you can help:**

1. **Optimize Your Requests and Cache Quotes:** Please make use of the `count` parameter to fetch multiple quotes (up to 50) in a single request whenever possible. This significantly reduces the load on the server. **Furthermore, cache the quotes you fetch locally in your application.** For example, if your app displays 5 quotes per day, fetching and caching 50 quotes means you'll have enough for 10 days without needing to make another API call. This not only reduces server load but also makes your app more resilient – if the API experiences downtime, your app can continue functioning using the cached quotes as long as the cache is intact.
    
2. **Commercial or Public Use? Deploy Your Own:** I understand the temptation to use the default endpoint (`quoteslate.vercel.app`) – it's definitely the easiest option. However, this endpoint is designed for hobbyists creating projects primarily for their own use or very small-scale applications. **If your project is commercial, intended for public use, or will generate a significant number of API calls, it is crucial that you fork this repository and deploy your own instance on Vercel.**  It's easy and free for most use cases! This gives you dedicated resources, ensures you won't be impacted by rate limits, and helps keep the public endpoint sustainable for everyone. **For very high-volume applications, you can even create multiple deployments on Vercel and implement load balancing on your app's end to distribute requests across them.** Think of QuoteSlate as _our_ project, not just mine. If you are building something that requires a lot of requests, take ownership and deploy your instance. If usage continues to grow as it has been, I may need to upgrade to Vercel's paid Pro plan in the future, which is a significant cost for me as a student. Deploying your own instance, when needed, is the most responsible and sustainable way to use the API for high-volume projects. Detailed instructions are in the [Deploying on Vercel](#deploying-on-vercel-easiest-for-high-volume-needs) section.
    
3. **Give Credit Where It's Due:** I don't ask for payment, but proper attribution is essential. If you use the QuoteSlate API in your project, please include a brief acknowledgment, such as:
    
    > "Quotes powered by the [QuoteSlate API](https://github.com/Musheer360/QuoteSlate)"
    >
    > "This project uses the QuoteSlate API, a free and open-source quote API. Check it out [here](https://github.com/Musheer360/QuoteSlate)"
    
4. **Show Your Support:** A simple star on this GitHub repository goes a long way in helping others discover the project and growing the community.

**Why This Matters:**

By following these guidelines, you help me keep the QuoteSlate API free and available for everyone. While Vercel's free plan is currently sufficient, a large number of individual requests puts a strain on those resources. If usage patterns don't change, I might have to upgrade to a paid plan, which would be a financial burden.

**Thank You:**

I appreciate your understanding and cooperation in making the QuoteSlate API a valuable resource for the entire community. Your responsible usage and support are what make this project possible!

## Features

### Core Functionality

-   🎲 **Random Quote Generation**: Fetch random quotes from a diverse collection
-   📄 **Systematic Browsing**: Browse all quotes with pagination support
-   🔍 **Advanced Search Functionality**: Search quotes by content and author names
-   📦 **Bulk Retrieval**: Get up to 50 random quotes or 100 paginated quotes in a single request
-   🔍 **Advanced Filtering**: Filter quotes by author, length, and tags
-   📊 **Metadata Access**: Retrieve complete lists of authors and tags
-   👤 **Author-Specific Access**: Get all quotes from specific authors with pagination
-   🏷️ **Tag-Specific Access**: Get all quotes with specific tags with pagination
-   🔄 **Flexible Sorting Capabilities**: Sort by ID, author, length, or random order
-   🔄 **Real-time Updates**: Regular updates to the quote database

### Technical Features

-   ⚡ **High Performance**: Optimized for quick response times
-   🛡️ **Rate Limiting**: 100 requests per 15 minutes per IP
-   🌐 **CORS Support**: Access from any origin
-   🔒 **Input Validation**: Robust parameter validation with decimal rejection
-   📝 **Detailed Error Messages**: Clear, actionable error responses
-   🔄 **RESTful Architecture**: Clean, predictable API endpoints
-   📖 **Open Source**: Fully transparent and community-driven
-   🔄 **Backward Compatible**: All original endpoints preserved

## Getting Started

No API key is required. Simply make HTTP requests to the endpoints using your preferred method.

### Quick Start Example

```javascript
// Fetch a random quote
fetch('https://quoteslate.vercel.app/api/quotes/random')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Deploying on Vercel (Easiest for High-Volume Needs)

If your project is commercial, intended for public use, or requires a large number of API calls, deploying your own instance on Vercel is **strongly recommended**. Here's how:

1. **Fork the Repository:** Click the "Fork" button at the top right of the main page of this repository to create a copy for yourself.
    
2. **Go to Your Vercel Dashboard:** Log in to your Vercel account (or create one – it's free!).
    
3. **Create a New Project:** Click the "New Project" button.
    
4. **Import Your Forked Repository:** In the "Import Git Repository" section, select your forked QuoteSlate repository from the list.
    
5. **Configure the Project (Optional):** You can usually keep the default settings. Vercel will automatically detect that it's a Node.js project.
    
6. **Deploy!** Click the "Deploy" button. Vercel will build and deploy your API.
    
7. **Your Own Endpoint:** Once deployed, you'll be given a unique URL (an endpoint) for your own instance of the QuoteSlate API. Use this URL in your application instead of `quoteslate.vercel.app`.
    
8. **(Optional) Multiple Deployments for Very High Volume:** If your project has extremely high request needs, you can create multiple deployments on Vercel by repeating steps 3-7 with different project names, each creating its own unique URL. Then implement load balancing on your app's end to distribute requests across these endpoints.

**It's that simple!** Vercel handles all the complexity of hosting and scaling for you. You get your own dedicated resources and won't have to worry about rate limits on the public endpoint. For detailed instructions, refer to [Vercel's documentation](https://vercel.com/docs).

### Running Locally

Follow these steps to run the API on your local machine:

1. **Prerequisites**
    
    -   Node.js (v14 or higher)
    -   npm (Node Package Manager)
    
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
    
    -   `quotes.json` - Contains the quotes data
    -   `authors.json` - Contains author names and their quote counts
    -   `tags.json` - Contains available tags
    
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

## 📖 API Documentation

### Interactive Documentation

QuoteSlate provides comprehensive OpenAPI 3.0 documentation with interactive testing capabilities:

- **🌐 Interactive Docs**: [https://quoteslate.vercel.app/docs](https://quoteslate.vercel.app/docs)
- **📄 OpenAPI Spec**: [https://quoteslate.vercel.app/openapi.yaml](https://quoteslate.vercel.app/openapi.yaml)
- **🎯 Try It Live**: Test all endpoints directly in the browser

### OpenAPI Features

- **Complete API Coverage**: All 7 endpoints fully documented
- **Interactive Testing**: Try endpoints with real data
- **Request/Response Examples**: Comprehensive examples for all scenarios
- **Parameter Validation**: Detailed parameter constraints and validation rules
- **Error Documentation**: All possible error responses with examples
- **Performance Metrics**: Response time expectations and caching information
- **Authentication**: No API key required - completely open access

### Documentation Highlights

- **📊 Real Statistics**: 2,616+ quotes, 1,010+ authors, 31 categories
- **⚡ Performance Info**: Average response times under 10ms
- **🧠 Smart Caching**: Detailed caching strategy explanation
- **🔒 Security**: Comprehensive security headers documentation
- **📱 Mobile Friendly**: Responsive documentation interface

## API Reference

### Endpoints

#### 1. Random Quotes (Original)

```http
GET /api/quotes/random
```

#### 2. Browse All Quotes (New - Paginated)

```http
GET /api/quotes
```

Browse all quotes systematically with pagination, search, sorting, and filtering.

**Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string) - Sort by: `id`, `author`, `length`, `random`
- `order` (string) - Sort order: `asc`, `desc`
- `search` (string) - Search in quote text and author names
- Plus all filtering parameters from random endpoint

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2616,
    "totalPages": 131,
    "hasNext": true,
    "hasPrev": false,
    "startIndex": 1,
    "endIndex": 20
  }
}
```

#### 3. Quotes by Author (New - Paginated)

```http
GET /api/quotes/by-author/:author
```

Get all quotes from a specific author with pagination.

**Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string) - Sort by: `id`, `length`, `random`
- `order` (string) - Sort order: `asc`, `desc`

#### 4. Quotes by Tag (New - Paginated)

```http
GET /api/quotes/by-tag/:tag
```

Get all quotes with a specific tag with pagination.

**Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string) - Sort by: `id`, `author`, `length`, `random`
- `order` (string) - Sort order: `asc`, `desc`

#### 5. Author List (Original)

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

#### 6. Authors List (New - Paginated)

```http
GET /api/authors/paginated
```

Browse authors with pagination and search.

**Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `sort` (string) - Sort by: `name`, `count`
- `order` (string) - Sort order: `asc`, `desc`
- `search` (string) - Search author names

**Response Format:**
```json
{
  "data": [
    {
      "name": "Albert Einstein",
      "count": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1010,
    "totalPages": 51,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### 7. Tags List

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

#### Random Quotes Endpoint Parameters

| Parameter   | Type     | Description                                          | Example                    |
| ----------- | -------- | ---------------------------------------------------- | -------------------------- |
| `authors`   | string   | Comma-separated list of author names                 | `authors=Babe%20Ruth,Ayn%20Rand` |
| `count`     | integer  | Number of quotes to return (1-50)                    | `count=5`                  |
| `maxLength` | integer  | Maximum character length of quotes                   | `maxLength=150`            |
| `minLength` | integer  | Minimum character length of quotes                   | `minLength=50`             |
| `tags`      | string   | Comma-separated list of tags                         | `tags=motivation,wisdom`    |

#### Pagination Parameters (New Endpoints)

| Parameter   | Type     | Description                                          | Example                    |
| ----------- | -------- | ---------------------------------------------------- | -------------------------- |
| `page`      | integer  | Page number (default: 1)                            | `page=2`                   |
| `limit`     | integer  | Items per page (default: 20, max: 100)              | `limit=50`                 |
| `sort`      | string   | Sort by: `id`, `author`, `length`, `random`          | `sort=author`              |
| `order`     | string   | Sort order: `asc`, `desc` (default: asc)            | `order=desc`               |
| `search`    | string   | Search in quote text and author names               | `search=love`              |

#### Validation Rules

- All numeric parameters must be whole numbers (decimals rejected)
- Empty string parameters are rejected with clear error messages
- Page numbers must be ≥ 1
- Limit must be between 1 and 100
- Author names are case-insensitive
- Tag names are case-sensitive
- Invalid authors/tags return 404 with descriptive errors

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

### Random Access (Original Endpoints)

1. **Single Random Quote**
    
    ```http
    GET /api/quotes/random
    ```
    
2. **Multiple Random Quotes**
    
    ```http
    GET /api/quotes/random?count=5
    ```

3. **Random Quotes with Filtering**
    
    ```http
    GET /api/quotes/random?authors=Babe%20Ruth,Maya%20Angelou&count=3
    GET /api/quotes/random?tags=motivation,wisdom&count=2
    GET /api/quotes/random?minLength=50&maxLength=150
    GET /api/quotes/random?authors=Babe%20Ruth&tags=wisdom&count=3&minLength=50
    ```

### Systematic Browsing (New Pagination Endpoints)

1. **Browse All Quotes**
    
    ```http
    # Basic pagination
    GET /api/quotes?page=1&limit=20
    
    # Search quotes
    GET /api/quotes?search=love&page=1&limit=10
    
    # Sort by length (longest first)
    GET /api/quotes?sort=length&order=desc&page=1&limit=5
    
    # Filter and paginate
    GET /api/quotes?authors=Albert%20Einstein&tags=wisdom&page=1&limit=10
    ```

2. **Browse Quotes by Specific Author**
    
    ```http
    # Get Einstein's quotes
    GET /api/quotes/by-author/Albert%20Einstein?page=1&limit=10
    
    # Sort by length
    GET /api/quotes/by-author/Buddha?sort=length&order=asc&page=1&limit=5
    
    # Random order
    GET /api/quotes/by-author/William%20Shakespeare?sort=random&page=1&limit=3
    ```

3. **Browse Quotes by Specific Tag**
    
    ```http
    # Get motivation quotes
    GET /api/quotes/by-tag/motivation?page=1&limit=15
    
    # Sort by author
    GET /api/quotes/by-tag/wisdom?sort=author&order=asc&page=1&limit=10
    
    # Random wisdom quotes
    GET /api/quotes/by-tag/wisdom?sort=random&page=1&limit=10
    ```

4. **Browse Authors**
    
    ```http
    # Browse all authors
    GET /api/authors/paginated?page=1&limit=50
    
    # Search authors
    GET /api/authors/paginated?search=Einstein&page=1&limit=10
    
    # Authors with most quotes
    GET /api/authors/paginated?sort=count&order=desc&page=1&limit=20
    ```

### JavaScript Examples

```javascript
// Random quote
fetch('/api/quotes/random')
  .then(response => response.json())
  .then(data => console.log(data));

// Browse quotes with pagination
fetch('/api/quotes?page=1&limit=10&sort=author')
  .then(response => response.json())
  .then(data => {
    console.log('Quotes:', data.data);
    console.log('Pagination:', data.pagination);
  });

// Search quotes
fetch('/api/quotes?search=love&page=1&limit=5')
  .then(response => response.json())
  .then(data => console.log(data));

// Get author's quotes
fetch('/api/quotes/by-author/Albert%20Einstein?page=1&limit=5')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Error Handling

### HTTP Status Codes

| Status Code | Description                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200         | Successful request                                                                                                                                               |
| 400         | Invalid parameters or incompatible filters                                                                                                                       |
| 404         | No matching quotes found                                                                                                                                         |
| 429         | Rate limit exceeded. Please use the `count` parameter to optimize your requests and cache the results. For high-volume needs, deploy your own instance of the API. |
| 500         | Internal server error                                                                                                                                            |

### Error Response Format

```json
{
  "error": "Detailed error message here"
}
```

### Common Error Messages

-   Invalid authors:
    
    ```json
    {
      "error": "Invalid author(s): Unknown Author, Another Invalid"
    }
    ```
    
-   Invalid tags:
    
    ```json
    {
      "error": "Invalid tag(s): invalid1, invalid2"
    }
    ```
    
-   Count validation:
    
    ```json
    {
      "error": "Count must be a number between 1 and 50."
    }
    ```

-   Decimal number rejection:
    
    ```json
    {
      "error": "count must be a whole number."
    }
    ```

-   Empty parameter:
    
    ```json
    {
      "error": "authors cannot be empty."
    }
    ```

-   Pagination errors:
    
    ```json
    {
      "error": "page must be greater than or equal to 1."
    }
    ```
    
    ```json
    {
      "error": "Page not found. No quotes available for the requested page."
    }
    ```

-   Author/tag not found:
    
    ```json
    {
      "error": "Author \"NonExistent\" not found."
    }
    ```

## Rate Limiting

-   **Limit**: 100 requests per 15 minutes
-   **Scope**: Per IP address
-   **Headers**: Standard rate limit headers included in responses
-   **Recovery**: Limits reset automatically after the 15-minute window
-   **Important:** Exceeding the rate limit will result in a `429 Too Many Requests` error. To avoid this, utilize the `count` parameter to fetch multiple quotes in a single request and cache the results locally. If you require high-volume access, please fork the repository and deploy your own instance.

## Technical Details

### Architecture

-   Built with Express.js
-   RESTful API design principles
-   Stateless request handling
-   JSON-based data storage and responses

### CORS Support

-   Supports cross-origin requests from any domain
-   Includes necessary CORS headers in responses
-   OPTIONS requests handled automatically

### Performance Considerations

-   Response times typically under 100ms
-   Efficient caching of author and tag data
-   Optimized random quote selection algorithm
-   Proxy-aware configuration for accurate rate limiting

### Security Features

-   **Input sanitization and validation** with comprehensive parameter checking
-   **Enhanced numeric validation** rejects negative values and invalid inputs
-   **Consistent error responses** with proper HTTP status codes and JSON format
-   **Security headers** including X-Content-Type-Options, X-Frame-Options, and X-XSS-Protection
-   **Rate limiting** to prevent abuse (100 requests per 15 minutes per IP)
-   **Author name normalization** and validation against known authors
-   **Tag validation** against predefined list
-   **HTTP method validation** with proper 405 Method Not Allowed responses

## Testing

QuoteSlate includes a comprehensive test suite to ensure API reliability and security.

### Running Tests

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Run tests (in a separate terminal):**
   ```bash
   npm test
   ```

### Test Coverage

The test suite validates:
- Basic API functionality (GET requests)
- Parameter validation (numeric, string, and range validation)
- Error handling (4xx status codes with JSON responses)
- Security headers presence
- HTTP method restrictions
- Invalid endpoint handling

## Contributing

QuoteSlate is open source and we welcome contributions! Please feel free to submit issues and pull requests to the repository.

## Projects Using QuoteSlate

- [BlankSlate](https://github.com/Musheer360/BlankSlate)
- [QuoteNest](https://github.com/hunterschep/QuoteNest)
- [DesktopQuotes](https://github.com/RaoHammas/DesktopQuotes)
- [Quoty](https://github.com/Arihant25/quoty)
- [Inspiro Quotes](https://github.com/gwendolyn954/inspiro-quotes)

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ by [Musheer Alam](https://github.com/Musheer360)

[⬆ Back to top](#quoteslate-api)

</div>
