import { Guild } from "oceanic.js";
import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";
import { authenticateJWT } from "../../middleware/authMiddleware";

const guildsRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.use("/:id", authenticateJWT(client));

  client.modules.forEach(module => {
    if (module.service) {
      router.use(
        `/:id/${module.name.toLowerCase()}`,
        module.service.getRouter()
      );
    }
  });

  router.get("/:id", async (
    req: Request<{ id: string }>,
    res: Response
  ): Promise<void> => {
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

    const guildData = await client.getModuleData("Main", guild.id);
    if (!guildData) {
      res.status(500).json({ error: "Failed to retrieve guild data" });
      return;
    }

    const modules = client.modules
      .map(m => m.name)
      .filter(m => !guildData.disabledModules.includes(m)
                    && !["Main", "Logging"].includes(m));

    res.status(200).json({
      guild: {
        ...guild,
        modules
      }
    });
  });

  return router;
};

export default guildsRoute;