module.exports = {
  apps: [{
    name: 'cicero-backend',
    script: 'backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5016,
      MONGODB_URI: 'mongodb://localhost:27017/cicero',
      CORS_ORIGIN: 'http://localhost:3000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5016,
      MONGODB_URI: 'mongodb://localhost:27017/cicero',
      CORS_ORIGIN: 'https://mrx3k1.de'
    },
    error_file: './logs/cicero-error.log',
    out_file: './logs/cicero-out.log',
    log_file: './logs/cicero-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:SS Z'
  }]
};