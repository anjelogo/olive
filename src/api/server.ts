import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ExtendedClient from "../Base/Client";
import guildsRoute from "./routes/guilds";
import userRoute from "./routes/users";
import authRoute from "./routes/auth";
import CommandsRoute from "./routes/commands";
import rateLimit from "./middleware/rateLimit";
import errorHandler from "./middleware/errorHandler";

export function createApi(client: ExtendedClient) {
  const api = express();
  api.set("trust proxy", 1);

  api.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    })
  );
  api.use(rateLimit);
  api.use(express.json());
  api.use(cookieParser());
  api.use("/api/auth", authRoute(client));
  api.use("/api/guilds", guildsRoute(client));
  api.use("/api/users", userRoute(client));
  api.use("/api/commands", CommandsRoute(client));

  // Register last
  api.use(errorHandler);

  return api;
}

export default createApi;
