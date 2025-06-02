import { Router, Request, Response } from "express";
import ExtendedClient from "../../../Base/Client";

const CommandsRoute = (client: ExtendedClient): Router => {
  const router = Router();

  router.get("/", (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const commands = client.commands
      .filter(c => !c.devOnly)
      .map(command => ({
        name: command.commands[0],
        description: command.description,
        category: command.category,
        example: command.example,
        usage: "/" + command.commands[0],
        tags: [command.category, ...(command.tags || [])],
      }));

    if (!commands || commands.length === 0) {
      res.status(404).json({
        message: "No commands found",
        commands: []
      });
      return;
    }

    res.status(200).json({
      commands
    });
    return;
  });

  return router;
};

export default CommandsRoute;