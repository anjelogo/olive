import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";

const modulesRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/:moduleName", (
    req: Request<{ moduleName: string }>,
    res: Response
  ) => {
    const moduleName= req.params.moduleName;

    if (!client.modules.find(m => m.name === moduleName)) {
      res.status(404).json({
        error: "Module not found",
        message: `Module "${moduleName}" not found.`
      });
      return;
    }

    const module = client.modules.find(m => m.name === moduleName);

    if (!module) {
      res.status(404).json({
        error: "Module not found",
        message: `Module "${moduleName}" not found.`
      });
      return;
    }
    res.status(200).json({
      message: `Module "${moduleName}" found.`,
    });
    return;
  });

  return router;
};

export default modulesRoute;