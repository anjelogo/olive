import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";
import { authenticateJWT } from "../../middleware/authMiddleware";

const userRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const userID = req.params.id;

    if (!userID) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    const user = client.users.find(u => u.id === userID);
    console.log(user);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userData = await client.getModuleData<"User", "user">("User", { userID });

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatarURL(),
        banner: user.bannerURL(),
        settings: userData
      }
    });
    return;
  });

  router.use("/:id/guilds", authenticateJWT(client));
  router.get("/:id/guilds", async (req: Request<{ id: string }>, res: Response) => {
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

    let guilds = client.guilds.filter(guild => guild.members.has(userID));

    if (!guilds) {
      res.status(404).json({ error: "Guilds not found" });
      return;
    }

    for (const guild of guilds) {
      const hasPerm = await client.getModule("Main").hasPerm(user, "main.web.view", guild.id);
      if (hasPerm == false) {
        guilds = guilds.filter(g => g.id !== guild.id);
      }
    }

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