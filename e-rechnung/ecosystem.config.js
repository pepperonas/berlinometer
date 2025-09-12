module.exports = {
  apps: [
    // HandwerkOS API Backend
    {
      name: 'handwerkos-api',
      script: 'dist/index.js',
      cwd: './apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1'
      },
      env_file: '.env.prod',
      error_file: './logs/handwerkos-api-error.log',
      out_file: './logs/handwerkos-api-out.log',
      log_file: './logs/handwerkos-api.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Auto restart at specific times (maintenance window)
      cron_restart: '0 4 * * *', // Restart daily at 4 AM
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Environment variables
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
    },
    
    // HandwerkOS Web Frontend
    {
      name: 'handwerkos-web',
      script: 'server.js',
      cwd: './apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1'
      },
      env_file: '.env.prod',
      error_file: './logs/handwerkos-web-error.log',
      out_file: './logs/handwerkos-web-out.log',
      log_file: './logs/handwerkos-web.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '300M',
      node_args: '--max-old-space-size=384',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Auto restart at specific times (maintenance window)
      cron_restart: '0 4 * * *', // Restart daily at 4 AM
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      // Environment variables
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
    },

    // Queue Worker for Background Jobs
    {
      name: 'handwerkos-worker',
      script: 'dist/worker.js',
      cwd: './apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 3
      },
      env_file: '.env.prod',
      error_file: './logs/handwerkos-worker-error.log',
      out_file: './logs/handwerkos-worker-out.log',
      log_file: './logs/handwerkos-worker.log',
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
      // Auto restart at specific times
      cron_restart: '0 4 * * *',
      // Graceful shutdown
      kill_timeout: 10000, // Longer for job completion
      listen_timeout: 5000,
      // Environment variables
      autorestart: true,
      // Logging
      merge_logs: true,
      log_type: 'json',
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: 'mrx3k1.de',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/handwerkos.git',
      path: '/var/www/handwerkos',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install -y nginx postgresql-client redis-tools',
      'post-setup': 'ls -la'
    }
  }
}