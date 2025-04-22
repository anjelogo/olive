module.exports = {
  apps: [
    {
      name: "olive",
      script: "./index.js",
      cwd: "./dist",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};