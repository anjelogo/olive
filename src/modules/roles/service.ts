import { Router } from "express";
import ExtendedClient from "../../Base/Client";
import Service from "../../Base/Service";

export default class RoleService extends Service {

  protected bot: ExtendedClient;
  protected router = Router();
  protected fields = [
    {
      label: "Role Save on Leave",
      description: "Save the role when the user leaves the server",
      type: "checkbox"
    }
  ]

  constructor(bot: ExtendedClient) {
    super(bot);

    this.bot = bot;
  }
}