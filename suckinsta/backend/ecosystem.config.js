module.exports = {
  apps: [{
    name: 'suckinsta-backend',
    script: 'server.js',
    cwd: '/var/www/html/suckinsta/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5080
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    // Restart settings
    min_uptime: '10s',
    max_restarts: 5,
    // Advanced features
    kill_timeout: 5000,
    listen_timeout: 8000,
    // Environment variables
    env_file: '.env'
  }]
};