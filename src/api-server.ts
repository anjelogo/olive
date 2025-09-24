import ExtendedClient from "./Base/Client";
import createApi from "./api/server";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

async function main() {
  // Create a minimal ExtendedClient so routes can access modules, DB, and permission logic
  const client = new ExtendedClient({
    defaultImageFormat: "png",
    defaultImageSize: 1024,
    disabledModules: [],
    // No auth/gateway options needed; we won't connect
  });

  // Initialize DB connection via Module.init() paths
  await client.initModulesOnly();

  const api = createApi(client);
  const port = Number(process.env.API_PORT ?? 5000);
  api.listen(port, () => {
    console.log(`API (standalone) is running on port ${port}`);
  });
}

main().catch((e) => {
  console.error("Failed to start standalone API:", e);
  process.exit(1);
});

export {};
