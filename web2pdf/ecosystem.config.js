module.exports = {
  apps: [{
    name: 'web2pdf',
    script: './app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5081
    },
    error_file: '/var/log/pm2/web2pdf-error.log',
    out_file: '/var/log/pm2/web2pdf-out.log',
    log_file: '/var/log/pm2/web2pdf-combined.log',
    time: true
  }]
};