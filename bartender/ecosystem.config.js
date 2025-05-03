module.exports = {
  apps: [{
    name: 'bartender',
    script: 'server.js', // Main server file (create this when implementing a backend)
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5024
    }
  }]
};