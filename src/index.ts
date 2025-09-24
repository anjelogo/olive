import ExtendedClient from "./Base/Client";

// Sharding configuration via environment variables
// SHARD_COUNT: total shards across the whole bot (default 1)
// SHARD_ID: optional specific shard id for this process; if not provided, we use PM2's NODE_APP_INSTANCE
const TOTAL_SHARDS = Number(process.env.SHARD_COUNT ?? 1);
const pm2Instance = process.env.NODE_APP_INSTANCE;
const ENV_SHARD_ID = process.env.SHARD_ID !== undefined ? Number(process.env.SHARD_ID) : undefined;
const SHARD_ID = ENV_SHARD_ID !== undefined ? ENV_SHARD_ID : (pm2Instance !== undefined ? Number(pm2Instance) : undefined);

if (Number.isNaN(TOTAL_SHARDS) || TOTAL_SHARDS < 1) {
  throw new Error(`Invalid SHARD_COUNT: ${process.env.SHARD_COUNT}`);
}
if (SHARD_ID !== undefined && (Number.isNaN(SHARD_ID) || SHARD_ID < 0 || SHARD_ID >= TOTAL_SHARDS)) {
  throw new Error(`Invalid SHARD_ID (${SHARD_ID}). Must be between 0 and ${TOTAL_SHARDS - 1}.`);
}

const client = new ExtendedClient({
  defaultImageFormat: "png",
  defaultImageSize: 1024,
  disabledModules: [],
  auth: `Bot ${process.env.TOKEN}`,
  gateway: {
    getAllUsers:  true,
    intents: 3153551,
    maxShards: TOTAL_SHARDS,
    shardIDs: SHARD_ID !== undefined ? [SHARD_ID] : undefined,
  }
});

client.init().then(() => {
  console.log(`[Shard] Config -> total=${TOTAL_SHARDS}` + (SHARD_ID !== undefined ? `, id=${SHARD_ID}` : " (single-process)"));
  console.log("Client is ready!");
}).catch((err) => {
  console.error("Failed to initialize client:", err);
});