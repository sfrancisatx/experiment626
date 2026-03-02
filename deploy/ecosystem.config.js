module.exports = {
  apps: [{
    name: 'experiment626',
    script: 'lib/index.js',
    cwd: '/opt/experiment626/experiment626-server',
    env: {
      NODE_ENV: 'production',
      PORT: 5111
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
