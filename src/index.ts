import ExtendedClient from "./Base/Client";
import express from "express";

import guildsRoute from "./api/routes/guild";
import userRoute from "./api/routes/user";


const client = new ExtendedClient({
  defaultImageFormat: "png",
  defaultImageSize: 1024,
  disabledModules: [],
  auth: `Bot ${process.env.TOKEN}`,
  gateway: {
    getAllUsers:  true,
    intents: 14063,
  }
});



client.init().then(() => {
  const api = express();

  api.use(express.json());
  api.use("/api/guilds", guildsRoute(client));
  api.use("/api/users", userRoute(client));
  
  api.listen(process.env.PORT || 3000, () => {
    console.log(`API is running on port ${process.env.PORT || 3000}`);
  });
  console.log("Client is ready!");
}).catch((err) => {
  console.error("Failed to initialize client:", err);
});