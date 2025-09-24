module.exports = {
  apps: [
    {
      name: "olive",
      script: "./index.js",
      cwd: "./dist",
      env_file: ".env",
      // Run one shard per process in fork mode. PM2 sets NODE_APP_INSTANCE = 0..instances-1
      exec_mode: "fork",
      // Set the number of instances to the total shard count. PM2 doesn't expand env here at runtime,
      // so prefer setting a concrete number or use the CLI to override. Default to 1.
      instances: process.env.SHARD_COUNT ? Number(process.env.SHARD_COUNT) : 1,
      env: {
        // You can set SHARD_COUNT here or in your environment
        // SHARD_COUNT: "4"
      }
    },
    {
      name: "olive-api",
      script: "./api-server.js",
      cwd: "./dist",
      env_file: ".env",
      exec_mode: "cluster",
      // Set API instances explicitly or via API_INSTANCES env when starting PM2
      instances: process.env.API_INSTANCES ? Number(process.env.API_INSTANCES) : 1,
      env: {
        API_PORT: process.env.API_PORT || "5000",
      }
    },
  ],
};