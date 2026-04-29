module.exports = {
  apps: [
    {
      name: 'patakus-api',
      script: 'dist/src/main.js',
      cwd: '/home/jorge/patakus/apps/api',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'patakus-web',
      script: '/home/jorge/patakus/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/jorge/patakus/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
