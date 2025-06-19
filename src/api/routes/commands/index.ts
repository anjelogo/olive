import { Router, Request, Response } from "express";
import { Constants } from "oceanic.js";
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
        usage: command.type === Constants.ApplicationCommandTypes.CHAT_INPUT ? (
          "/" + command.commands[0]
        ) : command.type === Constants.ApplicationCommandTypes.MESSAGE ? (
          `Right Click on a message and select "${command.commands[0]}"`
        ) : command.type === Constants.ApplicationCommandTypes.USER ? (
          `Right Click on a user and select "${command.commands[0]}"`
        ) : "",
        tags: [command.category, ...(command.tags || [])],
        type: command.type
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