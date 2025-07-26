module.exports = {
  apps: [{
    name: 'cicero-nginx-parser',
    script: 'nginx-parser.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/nginx-parser-error.log',
    out_file: './logs/nginx-parser-out.log',
    log_file: './logs/nginx-parser-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:SS Z',
    // Monitor for hangs
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Cron restart every 6 hours as backup
    cron_restart: '0 */6 * * *'
  }]
};