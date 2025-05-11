import ExtendedClient from "./Base/Client";
import express from "express";
import cors from "cors";
import guildsRoute from "./api/routes/guild";
import userRoute from "./api/routes/user";
import authRoute from "./api/routes/auth";


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
    origin: "https://olive.anjelogo.com",
    credentials: true,
  }));
  api.use(express.json());
  api.use("/api/auth", authRoute());
  api.use("/api/guilds", guildsRoute(client));
  api.use("/api/users", userRoute(client));
  
  api.listen(5000, () => {
    console.log("API is running on port 5000");
  });
  console.log("Client is ready!");
}).catch((err) => {
  console.error("Failed to initialize client:", err);
});