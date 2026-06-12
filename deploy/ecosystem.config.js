module.exports = {
  apps: [
    {
      name: 'seathold-server',
      script: './index.js',
      cwd: '/opt/seathold/server',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/opt/seathold/logs/server-error.log',
      out_file: '/opt/seathold/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
