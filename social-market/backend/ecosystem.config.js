module.exports = {
  apps: [{
    name: 'social-market-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5015
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5015
    }
  }]
};