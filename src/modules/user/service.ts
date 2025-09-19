import { Request, Response } from "express";
import Service, { DeepPartial, InputField } from "../../Base/Service";
import ExtendedClient from "../../Base/Client";
import { UserModuleData } from "../../Database/interfaces/UserModuleData";

export default class UserService extends Service {
  protected fields: InputField[] = [
    {
      label: "VC Notifications",
      description: "Toggle voice channel notification popups.",
      type: "checkbox",
      action: "/notifications/vc",
  module: "User",
      permissions: [],
      data: undefined
    }
  ];

  constructor(bot: ExtendedClient) {
    super(bot);
  }

  // For user services we won't use the base Service's guild guard; routes read userID from params.
  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
        const userID = req.params.id;
        if (!userID) return res.status(400).json({ error: "User ID is required" });

  const settings = await this.bot.getModuleData<"User","user">("User", { userID }) as UserModuleData;
        if (!settings) return res.status(404).json({ error: "User settings not found" });

        res.status(200).json({ message: "User Settings", data: settings });
      },
      "/notifications/vc": async (req, res) => {
        const userID = req.params.id;
        if (!userID) return res.status(400).json({ error: "User ID is required" });

        switch (req.method) {
        case "GET": {
          const settings = await this.bot.getModuleData<"User","user">("User", { userID }) as UserModuleData;
          if (!settings) return res.status(404).json({ error: "User settings not found" });
          return res.status(200).json({ message: "VC Notifications", data: { notifications: { vc: settings.notifications.vc } } });
        }
        case "POST": {
          const settings = await this.bot.getModuleData<"User","user">("User", { userID }) as UserModuleData;
          if (!settings) return res.status(404).json({ error: "User settings not found" });

          const body = req.body as DeepPartial<UserModuleData>;
          if (body.notifications && typeof body.notifications.vc === "boolean") {
            settings.notifications.vc = body.notifications.vc;
          } else {
            return res.status(400).json({ error: "Invalid notifications.vc" });
          }

          const updated = await this.bot.updateModuleData("User", settings, { userID });
          return res.status(200).json({ message: "Updated", data: updated });
        }
        default:
          return res.status(405).json({ error: "Method not allowed" });
        }
      }
    };
  }

  // Not used for user context but required by abstract; keep a stub that will never be invoked by our routes
  protected async updateData<K extends keyof import("../../Database/ModuleTypes").ModuleDataMap>(
    _params: { module: K; guildID: string },
    _data: DeepPartial<import("../../Database/ModuleTypes").ModuleDataMap[K]>
  ): Promise<import("../../Database/ModuleTypes").ModuleDataMap[K]> {
    throw new Error("Not implemented for user service");
  }
}
