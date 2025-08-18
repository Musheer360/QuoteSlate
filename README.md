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
-   📦 **Bulk Retrieval**: Get up to 50 quotes in a single request
-   🔍 **Advanced Filtering**: Filter quotes by author, length, and tags
-   📊 **Metadata Access**: Retrieve complete lists of authors and tags
-   🔄 **Real-time Updates**: Regular updates to the quote database

### Technical Features

-   ⚡ **High Performance**: Optimized for quick response times
-   🛡️ **Rate Limiting**: 100 requests per 15 minutes per IP
-   🌐 **CORS Support**: Access from any origin
-   🔒 **Input Validation**: Robust parameter validation
-   📝 **Detailed Error Messages**: Clear, actionable error responses
-   🔄 **RESTful Architecture**: Clean, predictable API endpoints
-   📖 **Open Source**: Fully transparent and community-driven
-   📘 **OpenAPI Documentation**: Specification available at `/api/openapi.json`

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

## API Reference

An OpenAPI specification is available at `/api/openapi.json`.

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
  // additional authors and their quote totals
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
  // additional tags
]
```

### Parameters

| Parameter   | Type     | Description                                          | Example                    |
| ----------- | -------- | ---------------------------------------------------- | -------------------------- |
| `authors`   | string   | Comma-separated list of author names                 | `authors=Babe%20Ruth,Ayn%20Rand` |
| `count`     | integer  | Number of quotes to return (1-50)                    | `count=5`                  |
| `maxLength` | integer  | Maximum character length of quotes                   | `maxLength=150`            |
| `minLength` | integer  | Minimum character length of quotes                   | `minLength=50`             |
| `tags`      | string   | Comma-separated list of tags                         | `tags=motivation,wisdom`    |

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
  // additional quotes
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

| Status Code | Description |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| 200 | Successful request |
| 400 | Invalid parameters or incompatible filters |
| 404 | No matching quotes found |
| 429 | Rate limit exceeded. Please use the `count` parameter to optimize your requests and cache the results. For high-volume needs, deploy your own instance of the API. |
| 500 | Internal server error |

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

## Rate Limiting

-   **Limit**: 100 requests per 15 minutes
-   **Scope**: Per IP address
-   **Headers**: Standard rate limit headers included in responses
-   **Recovery**: Limits reset automatically after the 15-minute window
-   **Configuration**: Set `ENABLE_RATE_LIMIT=false` to disable rate limiting (useful for testing). Unset or `true` keeps it enabled.
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

Run the test suite directly:

```bash
npm test
```

The tests automatically start a server instance with rate limiting disabled, execute all checks, and then verify rate limiting behavior with the limiter enabled.

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

Made with ❤️ by [Musheer360](https://github.com/Musheer360)

[⬆ Back to top](#quoteslate-api)

</div>
