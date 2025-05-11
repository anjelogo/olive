import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";

const userRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
    const userID = req.params.id;

    if (!userID) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    const user = client.findUser(userID);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.status(200).json({
      user
    });
    return;
  });

  router.get("/:id/guilds", (req: Request<{ id: string }>, res: Response) => {
    const userID = req.params.id;

    if (!userID) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const user = client.findUser(userID);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const guilds = client.guilds.filter(guild => guild.members.has(userID));

    if (!guilds) {
      res.status(404).json({ error: "Guilds not found" });
      return;
    }

    guilds.filter(guild => guild.members.get(userID)?.permissions.has("MANAGE_GUILD"));

    res.status(200).json({
      guilds: guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
      })),
    });

    return;
  });

  return router;
};

export default userRoute;