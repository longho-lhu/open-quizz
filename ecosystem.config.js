module.exports = {
  apps: [
    {
      name: 'open-quiz',
      cwd: __dirname,
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3008
      }
    }
  ]
};
