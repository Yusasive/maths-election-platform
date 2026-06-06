module.exports = {
  apps: [
    {
      name: 'maths-election-api',
      script: 'dist/main.js',
      instances: 'max',       // one process per CPU core
      exec_mode: 'cluster',   // share port across all instances
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Restart policy: back off on repeated crashes
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      // Log files
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
