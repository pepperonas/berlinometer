module.exports = {
  apps: [{
    name: 'dart-snizzle-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5070,
      MONGODB_URI: 'mongodb://localhost:27017/dart-snizzle'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5070,
      MONGODB_URI: 'mongodb://localhost:27017/dart-snizzle',
      CORS_ORIGIN: 'https://mrx3k1.de'
    },
    error_file: './logs/dart-snizzle-error.log',
    out_file: './logs/dart-snizzle-out.log',
    log_file: './logs/dart-snizzle.log',
    time: true
  }]
};