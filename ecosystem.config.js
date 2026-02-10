module.exports = {
  apps: [
    {
      name: 'popular-times-api',
      script: '/var/www/html/popular-times/server.py',
      interpreter: '/var/www/html/popular-times/venv/bin/python',
      cwd: '/var/www/html/popular-times',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PATH: '/var/www/html/popular-times/venv/bin:/usr/local/bin:/usr/bin:/bin',
        MYSQL_HOST: 'localhost',
        MYSQL_USER: 'martin',
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
        MYSQL_DATABASE: 'popular_times_db',
        MYSQL_PORT: '3306',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ''
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
