module.exports = {
  apps: [
    {
      name: "olive",
      script: "./index.js",
      cwd: "./dist",
      env_file: "../../../../local.env"
    },
  ],
};