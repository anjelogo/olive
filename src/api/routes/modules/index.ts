import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";

const modulesRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:moduleName", (
    req: Request<{ moduleName: string }>,
    res: Response
  ) => {
    const { moduleName } = req.params;

    const module = client.modules.find(
      m => m.name.toLowerCase() === moduleName.toLowerCase()
    );

    if (!module || !module.service) {
      res.status(404).json({
        error: "Module not found",
        message: `Module "${moduleName}" not found or has no service.`
      });
      return;
    }

    res.status(200).json({
      message: `Module "${moduleName}" found.`,
      fields: module.service["fields"]
    });
    return;
  });

  return router;
};

export default modulesRoute;