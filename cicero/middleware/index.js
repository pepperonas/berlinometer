const axios = require('axios');

/**
 * Cicero Middleware - Lightweight request logging for server monitoring
 * 
 * This middleware automatically logs HTTP requests to the Cicero monitoring system.
 * It captures detailed request/response information for analysis and debugging.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.ciceroUrl - URL of the Cicero server (default: http://localhost:5016)
 * @param {string} options.serverName - Name identifier for this server
 * @param {string} options.serverUrl - URL of this server (for dashboard display)
 * @param {boolean} options.enabled - Enable/disable logging (default: true)
 * @param {Array} options.excludePaths - Array of paths to exclude from logging
 * @param {Array} options.excludeHeaders - Array of header names to exclude from logging
 * @param {number} options.timeout - Request timeout in ms (default: 5000)
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * 
 * @returns {Function} Express middleware function
 */
function ciceroMiddleware(options = {}) {
  const config = {
    ciceroUrl: options.ciceroUrl || process.env.CICERO_URL || 'http://localhost:5016',
    serverName: options.serverName || process.env.SERVER_NAME || 'unknown-server',
    serverUrl: options.serverUrl || process.env.SERVER_URL || 'http://localhost',
    enabled: options.enabled !== undefined ? options.enabled : true,
    excludePaths: options.excludePaths || ['/health', '/ping', '/favicon.ico'],
    excludeHeaders: options.excludeHeaders || ['authorization', 'cookie', 'x-api-key'],
    timeout: options.timeout || 5000,
    logErrors: options.logErrors !== undefined ? options.logErrors : true
  };

  // If disabled, return no-op middleware
  if (!config.enabled) {
    return (req, res, next) => next();
  }

  return (req, res, next) => {
    const startTime = Date.now();

    // Skip excluded paths
    if (config.excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;

    // Override res.end to capture response data
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Filter sensitive headers
      const filteredHeaders = { ...req.headers };
      config.excludeHeaders.forEach(header => {
        delete filteredHeaders[header.toLowerCase()];
      });

      // Prepare request data
      const requestData = {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTime: responseTime,
        headers: filteredHeaders,
        query: req.query || {},
        body: req.body || {},
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || req.connection.remoteAddress || '',
        server: config.serverName,
        contentLength: res.get('Content-Length') ? parseInt(res.get('Content-Length')) : null
      };

      // Add error information if applicable
      if (res.statusCode >= 400 && config.logErrors) {
        requestData.error = chunk ? chunk.toString() : `HTTP ${res.statusCode}`;
      }

      // Send to Cicero asynchronously (don't block response)
      logToCicero(requestData, config).catch(error => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Cicero logging failed:', error.message);
        }
      });

      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Sends request data to Cicero server
 * @param {Object} requestData - The request data to log
 * @param {Object} config - Configuration options
 */
async function logToCicero(requestData, config) {
  try {
    await axios.post(`${config.ciceroUrl}/api/log`, requestData, {
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Silently fail in production to avoid disrupting the main application
    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }
  }
}

/**
 * Registers the server with Cicero
 * @param {Object} options - Server registration options
 * @param {string} options.ciceroUrl - URL of the Cicero server
 * @param {string} options.serverName - Name identifier for this server
 * @param {string} options.serverUrl - URL of this server
 */
async function registerServer(options = {}) {
  const config = {
    ciceroUrl: options.ciceroUrl || process.env.CICERO_URL || 'http://localhost:5016',
    serverName: options.serverName || process.env.SERVER_NAME || 'unknown-server',
    serverUrl: options.serverUrl || process.env.SERVER_URL || 'http://localhost'
  };

  try {
    await axios.post(`${config.ciceroUrl}/api/servers`, {
      name: config.serverName,
      url: config.serverUrl
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Server '${config.serverName}' registered with Cicero at ${config.ciceroUrl}`);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Failed to register server with Cicero: ${error.message}`);
    }
  }
}

module.exports = {
  ciceroMiddleware,
  registerServer
};