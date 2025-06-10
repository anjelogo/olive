import express from "express";
import cors from "cors";
import ExtendedClient from "./Base/Client";
import guildsRoute from "./api/routes/guilds";
import userRoute from "./api/routes/users";
import authRoute from "./api/routes/auth";
import CommandsRoute from "./api/routes/commands";
import { authenticateJWT } from "./api/middleware/authMiddleware";


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

  api.use(cors({
    //origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }));
  api.use(express.json());
  api.use("/api/auth", authRoute(client));
  api.use("/api/guilds", authenticateJWT(client), guildsRoute(client));
  api.use("/api/users", userRoute(client));
  api.use("/api/commands", CommandsRoute(client));
  
  api.listen(5000, () => {
    console.log("API is running on port 5000");
  });
  console.log("Client is ready!");
}).catch((err) => {
  console.error("Failed to initialize client:", err);
});