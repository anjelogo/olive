import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";
import { Guild } from "oceanic.js";

const guildsRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:id", (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const guildID = req.params.id;

    if (!guildID) {
      res.status(400).json({ error: "Guild ID is required" });
      return;
    }
    const guild = client.findGuild(guildID) as Guild;
    if (!guild) {
      res.status(404).json({ error: "Guild not found" });
      return;
    }

    res.status(200).json({
      guild
    });
    return;
  });

  return router;
};

export default guildsRoute;