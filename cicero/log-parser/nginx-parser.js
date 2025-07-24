#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');
const geoip = require('geoip-lite');

// Configuration
const NGINX_LOG_PATH = '/var/log/nginx/access.log';
const CICERO_API = 'https://mrx3k1.de/cicero/api/log';
const SERVER_NAME = 'mrx3k1-main';

// Nginx log format parser
// Default format: '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"'
function parseNginxLog(line) {
  const regex = /^(\S+) - (\S+) \[([^\]]+)\] "([^"]*)" (\d+) (\d+) "([^"]*)" "([^"]*)"/;
  const match = line.match(regex);
  
  if (!match) return null;
  
  const [, ip, user, timestamp, request, status, bytes, referer, userAgent] = match;
  
  // Parse request
  const requestParts = request.split(' ');
  const method = requestParts[0] || 'GET';
  const url = requestParts[1] || '/';
  const protocol = requestParts[2] || 'HTTP/1.1';
  
  // Use current timestamp for simplicity
  const now = new Date();
  
  return {
    method,
    url,
    status: parseInt(status),
    responseTime: 0, // Not available in nginx logs
    timestamp: now.toISOString(),
    headers: {
      'user-agent': userAgent !== '-' ? userAgent : '',
      'referer': referer !== '-' ? referer : ''
    },
    query: {},
    body: {},
    userAgent: userAgent !== '-' ? userAgent : '',
    ip: ip,
    server: SERVER_NAME,
    contentLength: parseInt(bytes) || 0
  };
}

// Get real client IP from nginx logs
function getRealIP(logIP, xForwardedFor) {
  if (xForwardedFor && xForwardedFor !== '-') {
    return xForwardedFor.split(',')[0].trim();
  }
  return logIP;
}

// Send to Cicero
async function sendToCicero(logData) {
  try {
    await axios.post(CICERO_API, logData, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✓ Sent: ${logData.method} ${logData.url} (${logData.status}) from ${logData.ip}`);
  } catch (error) {
    console.error(`✗ Failed to send log:`, error.message);
  }
}

// Watch nginx log file
function watchNginxLogs() {
  console.log(`🔍 Watching nginx logs: ${NGINX_LOG_PATH}`);
  console.log(`📡 Sending to Cicero: ${CICERO_API}`);
  
  let lastPosition = 0;
  
  // Get initial file size
  try {
    const stats = fs.statSync(NGINX_LOG_PATH);
    lastPosition = stats.size;
    console.log(`📊 Starting from position: ${lastPosition}`);
  } catch (error) {
    console.error(`❌ Cannot access log file: ${error.message}`);
    process.exit(1);
  }
  
  // Watch for changes
  fs.watchFile(NGINX_LOG_PATH, { interval: 1000 }, async (curr, prev) => {
    if (curr.size > lastPosition) {
      const stream = fs.createReadStream(NGINX_LOG_PATH, {
        start: lastPosition,
        end: curr.size - 1,
        encoding: 'utf8'
      });
      
      let buffer = '';
      
      stream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            const logData = parseNginxLog(line.trim());
            if (logData) {
              // Filter out noise and avoid infinite loops
              if (!logData.url.includes('/favicon.ico') && 
                  !logData.url.includes('/.well-known/') &&
                  !logData.url.includes('/robots.txt') &&
                  !logData.url.includes('/cicero/api/log')) {
                sendToCicero(logData);
              }
            }
          }
        }
      });
      
      stream.on('end', () => {
        lastPosition = curr.size;
      });
      
      stream.on('error', (error) => {
        console.error(`❌ Error reading log file: ${error.message}`);
      });
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down nginx log parser...');
  fs.unwatchFile(NGINX_LOG_PATH);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down nginx log parser...');
  fs.unwatchFile(NGINX_LOG_PATH);
  process.exit(0);
});

// Start watching
console.log('🚀 Starting Nginx Log Parser for Cicero');
console.log('📋 Configuration:');
console.log(`   Log file: ${NGINX_LOG_PATH}`);
console.log(`   Cicero API: ${CICERO_API}`);
console.log(`   Server name: ${SERVER_NAME}`);
console.log('');

watchNginxLogs();