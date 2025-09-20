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
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userData = await client.getModuleData<"User", "user">("User", { userID });

    console.log(userData);

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
  router.post("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const userID = req.params.id;

    if (!userID) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }
    const user = client.users.find(u => u.id === userID);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

  let userData = await client.getModuleData<"User", "user">("User", { userID });

    if (!userData) {
      res.status(500).json({ error: "User data not found" });
      return;
    }

    // allow toggling values
    if (req.body.notifications) {
      const _ud = userData;
      if (!_ud) {
        res.status(500).json({ error: "User data not found" });
        return;
      }
      if (typeof req.body.notifications.vc === "boolean") {
        _ud.notifications.vc = req.body.notifications.vc;
        userData = _ud;
      } else {
        res.status(400).json({ error: "Invalid data for notifications.vc" });
        return;
      }
    }

    try {
      userData = await client.updateModuleData<"User","user">("User", userData, { userID });
    } catch (e) {
      res.status(500).json({ error: "Could not update user data" });
      return;
    }

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