// Fix for CodeQL vulnerability: js/missing-rate-limiting
// Apply rate limiting to OpenAPI documentation routes

// Option 1: Apply existing rate limiter to specific routes
app.get("/openapi.yaml", apiLimiter, (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(path.join(__dirname, "../openapi.yaml"));
});

app.get("/openapi.json", apiLimiter, (req, res) => {
  // Serve YAML as JSON for compatibility
  const yaml = require('fs').readFileSync(path.join(__dirname, "../openapi.yaml"), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: "OpenAPI JSON conversion not available. Please use /openapi.yaml or visit /docs for interactive documentation.",
    yaml_url: "/openapi.yaml",
    docs_url: "/docs"
  });
});

// Option 2: Create a separate, more lenient rate limiter for documentation
const docsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for documentation access
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests to documentation endpoints, please try again later.",
  }
});

app.get("/openapi.yaml", docsLimiter, (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.sendFile(path.join(__dirname, "../openapi.yaml"));
});

app.get("/openapi.json", docsLimiter, (req, res) => {
  // Serve YAML as JSON for compatibility
  const yaml = require('fs').readFileSync(path.join(__dirname, "../openapi.yaml"), 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: "OpenAPI JSON conversion not available. Please use /openapi.yaml or visit /docs for interactive documentation.",
    yaml_url: "/openapi.yaml",
    docs_url: "/docs"
  });
});

// Option 3: Apply rate limiting globally (affects all routes)
app.use(apiLimiter); // This would protect ALL routes, not just /api/*
