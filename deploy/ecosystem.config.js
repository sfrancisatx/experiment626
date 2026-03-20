module.exports = {
  apps: [{
    name: 'experiment626',
    script: 'build/index.js',
    cwd: '/opt/experiment626/experiment626-server',
    env: {
      NODE_ENV: 'production',
      PORT: 5111,
      DATABASE_URL: 'postgresql://postgres:y%25y(B%3CO_62e%23t%3Fv%3F@localhost:5432/postgres'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
