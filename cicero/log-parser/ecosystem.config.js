module.exports = {
  apps: [{
    name: 'cicero-nginx-parser',
    script: 'nginx-parser.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/nginx-parser-error.log',
    out_file: './logs/nginx-parser-out.log',
    log_file: './logs/nginx-parser-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:SS Z'
  }]
};