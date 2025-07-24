# Cicero Middleware

Lightweight Express middleware for logging HTTP requests to the Cicero monitoring system.

## Installation

```bash
npm install axios
```

## Quick Start

```javascript
const express = require('express');
const { ciceroMiddleware, registerServer } = require('./cicero/middleware');

const app = express();

// Add Cicero middleware
app.use(ciceroMiddleware({
  serverName: 'my-api-server',
  serverUrl: 'http://localhost:3000',
  ciceroUrl: 'http://localhost:5016'
}));

// Register server with Cicero (optional)
registerServer({
  serverName: 'my-api-server',
  serverUrl: 'http://localhost:3000'
});

// Your routes...
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

## Configuration Options

### ciceroMiddleware(options)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ciceroUrl` | string | `http://localhost:5016` | URL of the Cicero monitoring server |
| `serverName` | string | `unknown-server` | Identifier for this server |
| `serverUrl` | string | `http://localhost` | URL of this server |
| `enabled` | boolean | `true` | Enable/disable logging |
| `excludePaths` | array | `['/health', '/ping', '/favicon.ico']` | Paths to exclude from logging |
| `excludeHeaders` | array | `['authorization', 'cookie', 'x-api-key']` | Headers to exclude from logging |
| `timeout` | number | `5000` | Request timeout in milliseconds |
| `logErrors` | boolean | `true` | Whether to log error responses |

## Environment Variables

You can also configure the middleware using environment variables:

```bash
CICERO_URL=http://localhost:5016
SERVER_NAME=my-api-server
SERVER_URL=http://localhost:3000
```

## What Gets Logged

The middleware captures the following request information:

- HTTP method and URL
- Response status code and time
- Request headers (filtered for security)
- Query parameters
- Request body (if present)
- User agent and IP address
- Response time in milliseconds
- Error messages (for 4xx/5xx responses)

## Security Features

- Automatically filters sensitive headers (authorization, cookies, API keys)
- Configurable path exclusions
- Silent failure in production mode
- Configurable header filtering
- Non-blocking async logging

## Production Considerations

### Performance
- Logging is asynchronous and non-blocking
- Failed logging attempts don't affect your application
- Minimal overhead on request processing

### Security
- Sensitive headers are automatically filtered
- Error details are only logged if enabled
- Production mode suppresses error logging to console

### Reliability
- Silent failure mode prevents middleware from breaking your app
- Configurable timeouts prevent hanging requests
- Graceful degradation when Cicero server is unavailable

## Advanced Usage

### Custom Error Handling

```javascript
app.use(ciceroMiddleware({
  serverName: 'my-server',
  logErrors: true,
  excludePaths: ['/health', '/metrics', '/internal/*']
}));
```

### Multiple Servers

```javascript
// API Server
app.use(ciceroMiddleware({
  serverName: 'api-server',
  serverUrl: 'http://localhost:3001'
}));

// Web Server
app.use(ciceroMiddleware({
  serverName: 'web-server', 
  serverUrl: 'http://localhost:3000'
}));
```

### Conditional Logging

```javascript
app.use(ciceroMiddleware({
  enabled: process.env.NODE_ENV !== 'test',
  serverName: process.env.SERVICE_NAME || 'default-server'
}));
```

## Integration Examples

### With Existing Logging

```javascript
const morgan = require('morgan');
const { ciceroMiddleware } = require('./cicero/middleware');

// Use both Morgan (for local logs) and Cicero (for monitoring)
app.use(morgan('combined'));
app.use(ciceroMiddleware({
  serverName: 'api-server'
}));
```

### With Error Handling

```javascript
const { ciceroMiddleware } = require('./cicero/middleware');

app.use(ciceroMiddleware({
  serverName: 'api-server',
  logErrors: true
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
```

### Docker Deployment

```javascript
const { ciceroMiddleware, registerServer } = require('./cicero/middleware');

const config = {
  serverName: process.env.SERVICE_NAME || 'docker-service',
  serverUrl: process.env.SERVICE_URL || 'http://localhost:3000',
  ciceroUrl: process.env.CICERO_URL || 'http://cicero:5016'
};

app.use(ciceroMiddleware(config));

// Register after server starts
app.listen(3000, () => {
  registerServer(config);
});
```

## Troubleshooting

### Middleware Not Logging

1. Check if Cicero server is running on the specified port
2. Verify network connectivity between servers
3. Check if request paths are in the `excludePaths` list
4. Enable development mode to see error messages

### Performance Issues

1. Increase timeout value if requests are slow
2. Add more paths to `excludePaths` for high-traffic endpoints
3. Consider disabling logging for non-critical routes

### Security Concerns

1. Review and customize `excludeHeaders` for your security requirements
2. Ensure sensitive endpoints are properly excluded
3. Use HTTPS for production Cicero server communication

## License

MIT License - see LICENSE file for details.