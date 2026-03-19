module.exports = {
  apps: [
    {
      name: 'open-quiz',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3008',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
