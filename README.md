<h1 align="center">QuoteSlate API</h1>

<div align="center">

![QuoteSlate API](https://img.shields.io/badge/API-QuoteSlate-blue)
![API Status](https://img.shields.io/website?url=https%3A%2F%2Fquoteslate.vercel.app%2Fapi%2Fquotes%2Frandom&label=API%20Status)
![License](https://img.shields.io/badge/license-MIT-green)
![Rate Limit](https://img.shields.io/badge/rate%20limit-100%20req%2F15min-yellow)

A robust, developer-friendly API for serving inspirational and thought-provoking quotes with powerful filtering capabilities.

[Explore the API](https://quoteslate.vercel.app) | [Documentation](#api-reference) | [Deploy Your Own](#deploying-on-vercel-easiest-for-high-volume-needs)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Musheer360/QuoteSlate)

</div>

---

## 📚 Table of Contents

- [Overview](#overview)
- [Using QuoteSlate Responsibly](#using-quoteslate-responsibly)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Quick Start](#quick-start-example)
  - [Deploying on Vercel](#deploying-on-vercel-easiest-for-high-volume-needs)
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

---

## Overview

QuoteSlate API is a lightweight, high-performance API that provides access to a curated collection of **2,600+ inspirational quotes**. Built as an open-source RESTful service, it offers flexible filtering options, making it perfect for applications ranging from personal development apps to educational platforms.

**Base URL:** `https://quoteslate.vercel.app`

---

## Using QuoteSlate Responsibly

The QuoteSlate API is a labor of love, provided free of charge to support the developer community. My goal is to keep it open and accessible to everyone, especially for hobby projects and creative applications. It's currently hosted on Vercel's free plan, which generously provides resources for small-scale projects. However, to ensure its long-term sustainability for everyone, I ask for your cooperation in using the API responsibly.

### Here's how you can help:

#### 1. **Optimize Your Requests and Cache Quotes**
Please make use of the `count` parameter to fetch multiple quotes (up to 50) in a single request whenever possible. This significantly reduces the load on the server. 

**Furthermore, cache the quotes you fetch locally in your application.** For example, if your app displays 5 quotes per day, fetching and caching 50 quotes means you'll have enough for 10 days without needing to make another API call. This not only reduces server load but also makes your app more resilient – if the API experiences downtime, your app can continue functioning using the cached quotes.

#### 2. **Commercial or Public Use? Deploy Your Own**
I understand the temptation to use the default endpoint (`quoteslate.vercel.app`) – it's definitely the easiest option. However, this endpoint is designed for hobbyists creating projects primarily for their own use or very small-scale applications. 

**If your project is commercial, intended for public use, or will generate a significant number of API calls, it is crucial that you fork this repository and deploy your own instance on Vercel.** It's easy and free for most use cases! This gives you dedicated resources, ensures you won't be impacted by rate limits, and helps keep the public endpoint sustainable for everyone. 

**For very high-volume applications, you can even create multiple deployments on Vercel and implement load balancing on your app's end to distribute requests across them.** Think of QuoteSlate as _our_ project, not just mine. If you are building something that requires a lot of requests, take ownership and deploy your instance. Detailed instructions are in the [Deploying on Vercel](#deploying-on-vercel-easiest-for-high-volume-needs) section.

#### 3. **Give Credit Where It's Due**
I don't ask for payment, but proper attribution is essential. If you use the QuoteSlate API in your project, please include a brief acknowledgment, such as:

> "Quotes powered by the [QuoteSlate API](https://github.com/Musheer360/QuoteSlate)"

or

> "This project uses the QuoteSlate API, a free and open-source quote API. Check it out [here](https://github.com/Musheer360/QuoteSlate)"

#### 4. **Show Your Support**
A simple star ⭐ on this GitHub repository goes a long way in helping others discover the project and growing the community.

### Why This Matters

By following these guidelines, you help me keep the QuoteSlate API free and available for everyone. While Vercel's free plan is currently sufficient, a large number of individual requests puts a strain on those resources. If usage patterns don't change, I might have to upgrade to a paid plan, which would be a financial burden.

**Thank you for your understanding and cooperation in making the QuoteSlate API a valuable resource for the entire community!**

---

## Features

### Core Functionality

- 🎲 **Random Quote Generation** - Fetch random quotes from a diverse collection
- 📦 **Bulk Retrieval** - Get up to 50 quotes in a single request
- 🔍 **Advanced Filtering** - Filter quotes by author, length, and tags
- 📊 **Metadata Access** - Retrieve complete lists of authors and tags
- 🔄 **Regular Updates** - Continuously curated and improved quote database

### Technical Features

- ⚡ **High Performance** - Optimized for quick response times (<100ms)
- 🛡️ **Rate Limiting** - 100 requests per 15 minutes per IP
- 🌐 **CORS Support** - Access from any origin
- 🔒 **Input Validation** - Robust parameter validation and sanitization
- 📝 **Detailed Error Messages** - Clear, actionable error responses
- 🔄 **RESTful Architecture** - Clean, predictable API endpoints
- 📖 **Open Source** - Fully transparent and community-driven
- 📘 **OpenAPI Documentation** - Specification available at `/api/openapi.json`

---

## Getting Started

No API key is required. Simply make HTTP requests to the endpoints using your preferred method.

### Quick Start Example

```javascript
// Retrieve a random quote
fetch('https://quoteslate.vercel.app/api/quotes/random')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Deploying on Vercel (Easiest for High-Volume Needs)

If your project is commercial, intended for public use, or requires a large number of API calls, deploying your own instance on Vercel is **strongly recommended**. Here's how:

#### One-click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Musheer360/QuoteSlate)

#### Manual Deployment

1. **Fork the Repository** - Click the "Fork" button at the top right of this repository
2. **Go to Vercel Dashboard** - Log in to your Vercel account (or create one – it's free!)
3. **Create a New Project** - Click the "New Project" button
4. **Import Your Forked Repository** - Select your forked QuoteSlate repository
5. **Configure the Project** - Keep the default settings (Vercel auto-detects Node.js)
6. **Deploy!** - Click "Deploy" and Vercel will build and deploy your API
7. **Your Own Endpoint** - You'll receive a unique URL for your instance
8. **(Optional) Multiple Deployments** - For very high volume, create multiple deployments and implement load balancing

**It's that simple!** Vercel handles all the complexity of hosting and scaling for you. For detailed instructions, refer to [Vercel's documentation](https://vercel.com/docs).

### Running Locally

Follow these steps to run the API on your local machine:

#### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

#### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Musheer360/QuoteSlate.git
   cd QuoteSlate
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Verify Data Files**

   Ensure you have the following JSON files in the `data/` directory:
   - `quotes.json` - Contains the quotes data
   - `authors.json` - Contains author names and their quote counts
   - `tags.json` - Contains available tags

4. **Start the Server**

   ```bash
   npm start
   ```

   The API will be available at `http://localhost:3000`

5. **Test the Installation**

   ```bash
   curl http://localhost:3000/api/quotes/random
   ```

#### Data File Formats

The JSON files in the `data/` directory follow these formats:

**`data/quotes.json`:**
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

**`data/authors.json`:**
```json
{
  "Author Name": 5,
  "Another Author": 3
}
```

**`data/tags.json`:**
```json
["motivation", "wisdom", "life"]
```

---

## API Reference

An OpenAPI specification is available at `/api/openapi.json`.

### Endpoints

#### 1. Random Quotes

```http
GET /api/quotes/random
```

Retrieve one or more random quotes with optional filtering.

#### 2. Author List

```http
GET /api/authors
```

Returns an object with author names as keys and their quote counts as values.

**Response format:**

```json
{
  "Avery Brooks": 1,
  "Ayn Rand": 3,
  "Babe Ruth": 4
}
```

#### 3. Tags List

```http
GET /api/tags
```

Returns an array of all available tags.

**Response format:**

```json
[
  "motivation",
  "inspiration",
  "life",
  "wisdom"
]
```

### Parameters

All parameters are optional and can be combined for advanced filtering.

| Parameter   | Type    | Range/Limit | Description                                          | Example                           |
|-------------|---------|-------------|------------------------------------------------------|-----------------------------------|
| `authors`   | string  | Max 20      | Comma-separated list of author names (case-insensitive) | `authors=Babe%20Ruth,Ayn%20Rand` |
| `count`     | integer | 1-50        | Number of quotes to return                           | `count=5`                         |
| `maxLength` | integer | ≥1          | Maximum character length of quotes                   | `maxLength=150`                   |
| `minLength` | integer | ≥1          | Minimum character length of quotes                   | `minLength=50`                    |
| `tags`      | string  | Max 20      | Comma-separated list of tags (case-insensitive)      | `tags=motivation,wisdom`          |

**Notes:**
- Author names and tags are validated against the database
- `minLength` must be ≤ `maxLength`
- Invalid authors or tags will return a 400 error with details

### Response Format

#### Single Quote Response

When `count=1` (default), returns a single quote object:

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

When `count>1`, returns an array of quote objects:

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
]
```

---

## Usage Examples

### Basic Examples

**Single Random Quote**
```http
GET /api/quotes/random
```

**Multiple Random Quotes**
```http
GET /api/quotes/random?count=5
```

### Advanced Filtering

**Quotes by Specific Authors**
```http
GET /api/quotes/random?authors=Babe%20Ruth,Maya%20Angelou&count=3
```

**Quotes with Specific Tags**
```http
GET /api/quotes/random?tags=motivation,wisdom&count=2
```

**Length-Constrained Quotes**
```http
GET /api/quotes/random?minLength=50&maxLength=150
```

**Combined Filters**
```http
GET /api/quotes/random?authors=Babe%20Ruth&tags=wisdom&count=3&minLength=50
```

### JavaScript Examples

**Using Fetch API**
```javascript
async function getQuotes() {
  const response = await fetch('https://quoteslate.vercel.app/api/quotes/random?count=10');
  const quotes = await response.json();
  console.log(quotes);
}
```

**Using Axios**
```javascript
const axios = require('axios');

axios.get('https://quoteslate.vercel.app/api/quotes/random', {
  params: {
    tags: 'motivation,wisdom',
    count: 5
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Description                                                                                                      |
|-------------|------------------------------------------------------------------------------------------------------------------|
| 200         | Successful request                                                                                               |
| 400         | Invalid parameters (e.g., invalid author/tag, count out of range, minLength > maxLength)                        |
| 404         | No matching quotes found for the given filters                                                                   |
| 405         | Method not allowed (only GET requests are supported)                                                             |
| 429         | Rate limit exceeded. Use `count` parameter to optimize requests and cache results. For high-volume needs, deploy your own instance. |
| 500         | Internal server error                                                                                            |

### Error Response Format

All errors return a JSON object with an `error` field:

```json
{
  "error": "Detailed error message here"
}
```

### Common Error Messages

**Invalid Authors**
```json
{
  "error": "Invalid author(s): Unknown Author, Another Invalid"
}
```

**Invalid Tags**
```json
{
  "error": "Invalid tag(s): invalid1, invalid2"
}
```

**Count Validation**
```json
{
  "error": "count must be greater than or equal to 1."
}
```

**Length Validation**
```json
{
  "error": "minLength must be less than or equal to maxLength."
}
```

**Too Many Tags/Authors**
```json
{
  "error": "Maximum 20 tags allowed."
}
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes
- **Scope:** Per IP address
- **Headers:** Standard rate limit headers included in responses
- **Recovery:** Limits reset automatically after the 15-minute window
- **Configuration:** Set `ENABLE_RATE_LIMIT=false` environment variable to disable (useful for testing)

**Important:** Exceeding the rate limit will result in a `429 Too Many Requests` error. To avoid this:
1. Use the `count` parameter to fetch multiple quotes per request
2. Cache the results locally in your application
3. For high-volume needs, deploy your own instance

---

## Technical Details

### Architecture

- **Framework:** Express.js 5.x
- **Design:** RESTful API principles
- **Data Storage:** JSON-based (quotes, authors, tags)
- **Request Handling:** Stateless

### Performance

- **Response Time:** Typically <100ms
- **Optimization:** Efficient caching of author and tag data
- **Algorithm:** Optimized random quote selection using Fisher-Yates shuffle
- **Memory:** Minimal array copying for better performance

### Security Features

- **Input Validation:** Comprehensive parameter checking and sanitization
- **Numeric Validation:** Rejects negative values and invalid inputs
- **String Validation:** Author/tag validation against known values
- **Security Headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Rate Limiting:** Prevents abuse (100 req/15min per IP)
- **HTTP Method Validation:** Proper 405 responses for unsupported methods
- **Error Handling:** Consistent JSON error responses with appropriate status codes

### CORS Support

- Supports cross-origin requests from any domain
- Includes necessary CORS headers in all responses
- OPTIONS requests handled automatically

---

## Testing

QuoteSlate includes a comprehensive test suite to ensure API reliability and security.

### Running Tests

```bash
npm test
```

The tests automatically:
1. Start a server instance with rate limiting disabled
2. Execute all validation checks
3. Verify rate limiting behavior
4. Clean up after completion

### Test Coverage

The test suite validates:
- ✅ Basic API functionality (GET requests)
- ✅ Parameter validation (numeric, string, range)
- ✅ Error handling (4xx status codes with JSON responses)
- ✅ Security headers presence
- ✅ HTTP method restrictions
- ✅ Invalid endpoint handling
- ✅ Rate limiting functionality

---

## Contributing

QuoteSlate is open source and we welcome contributions! 

- 🐛 **Report bugs** by opening an issue
- 💡 **Suggest features** through discussions
- 🔧 **Submit pull requests** to improve the codebase
- 📝 **Improve documentation** to help others

Please ensure your contributions maintain the project's code quality and follow existing patterns.

---

## Projects Using QuoteSlate

- [BlankSlate](https://github.com/Musheer360/BlankSlate) - Minimalist new tab extension
- [QuoteNest](https://github.com/hunterschep/QuoteNest) - Quote management app
- [DesktopQuotes](https://github.com/RaoHammas/DesktopQuotes) - Desktop quote widget
- [Quoty](https://github.com/Arihant25/quoty) - Quote sharing platform
- [Inspiro Quotes](https://github.com/gwendolyn954/inspiro-quotes) - Inspirational quote generator

**Using QuoteSlate in your project?** Open a PR to add it to this list!

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ by [Musheer360](https://github.com/Musheer360)

**[⬆ Back to top](#quoteslate-api)**

</div>
