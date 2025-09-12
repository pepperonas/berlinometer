module.exports = {
  apps: [
    // HandwerkOS API Backend
    {
      name: 'handwerkos-api',
      script: 'dist/index.js',
      cwd: '/var/www/html/e-rechnung/apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3901,
        HOST: '127.0.0.1'
      },
      env_file: '/var/www/html/e-rechnung/.env.vps',
      error_file: '/var/www/html/e-rechnung/logs/handwerkos-api-error.log',
      out_file: '/var/www/html/e-rechnung/logs/handwerkos-api-out.log',
      log_file: '/var/www/html/e-rechnung/logs/handwerkos-api.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: [
        'node_modules', 
        'logs', 
        'uploads', 
        'documents', 
        'backups'
      ],
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Auto restart at 4 AM daily
      cron_restart: '0 4 * * *',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
      // Environment
      source_map_support: false,
    },
    
    // HandwerkOS Web Frontend
    {
      name: 'handwerkos-web',
      script: 'server.js',
      cwd: '/var/www/html/e-rechnung/apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3900,
        HOSTNAME: '127.0.0.1'
      },
      env_file: '/var/www/html/e-rechnung/.env.vps',
      error_file: '/var/www/html/e-rechnung/logs/handwerkos-web-error.log',
      out_file: '/var/www/html/e-rechnung/logs/handwerkos-web-out.log',
      log_file: '/var/www/html/e-rechnung/logs/handwerkos-web.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '384M',
      node_args: '--max-old-space-size=384',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: [
        'node_modules', 
        'logs', 
        '.next',
        'uploads',
        'documents'
      ],
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Auto restart at 4 AM daily
      cron_restart: '0 4 * * *',
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
    },

    // Queue Worker for Background Jobs
    {
      name: 'handwerkos-worker',
      script: 'dist/worker.js',
      cwd: '/var/www/html/e-rechnung/apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 2
      },
      env_file: '/var/www/html/e-rechnung/.env.vps',
      error_file: '/var/www/html/e-rechnung/logs/handwerkos-worker-error.log',
      out_file: '/var/www/html/e-rechnung/logs/handwerkos-worker-out.log',
      log_file: '/var/www/html/e-rechnung/logs/handwerkos-worker.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '256M',
      node_args: '--max-old-space-size=256',
      restart_delay: 4000,
      max_restarts: 15,
      min_uptime: '10s',
      watch: false,
      // Health check
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      // Auto restart at 4 AM daily
      cron_restart: '0 4 * * *',
      // Graceful shutdown for job completion
      kill_timeout: 10000,
      listen_timeout: 5000,
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
    }
  ],

  // Deployment configuration for VPS
  deploy: {
    production: {
      user: 'root',
      host: '69.62.121.168',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo/handwerkos-erp.git',
      path: '/var/www/html/e-rechnung',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.vps.config.js --env production',
      'pre-setup': 'apt update && apt install -y postgresql postgresql-contrib redis-server nginx nodejs npm',
      'post-setup': 'npm install -g pm2 && pm2 startup',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}