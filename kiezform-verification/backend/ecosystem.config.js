module.exports = {
  apps: [{
    name: 'kiezform-verification-api',
    script: './server.js',
    cwd: '/var/www/kiezform-verification/backend',
    instances: 1,
    exec_mode: 'fork',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5090
    },
    
    // Logging
    log_file: '/var/log/pm2/kiezform-verification.log',
    out_file: '/var/log/pm2/kiezform-verification-out.log',
    error_file: '/var/log/pm2/kiezform-verification-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    autorestart: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Performance
    max_memory_restart: '300M',
    node_args: '--max-old-space-size=256',
    
    // Monitoring
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log'
    ],
    
    // Health check
    health_check_grace_period: 5000,
    
    // Graceful shutdown
    kill_timeout: 10000,
    listen_timeout: 8000,
    
    // Advanced PM2 features
    merge_logs: true,
    time: true,
    
    // Custom settings
    env_file: '/var/www/kiezform-verification/backend/.env'
  }]
};