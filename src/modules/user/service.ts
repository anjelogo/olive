import { Request, Response } from "express";
import Service, {
  ContextForKey,
  Ctx,
  DeepPartial,
  InputField,
} from "../../Base/Service";
import ExtendedClient from "../../Base/Client";
import { UserModuleData } from "../../Database/interfaces/UserModuleData";
import { ModuleDataMap } from "../../Database/ModuleTypes";

export default class UserService<T extends "user"> extends Service<T> {
  protected fields: InputField[] = [
    {
      label: "VC Notifications",
      description: "Toggle voice channel notification popups.",
      type: "checkbox",
      action: "/notifications/vc",
      module: "User",
      permissions: [],
      data: undefined,
    },
  ];

  // For user services we won't use the base Service's guild guard; routes read userID from params.
  protected getRouteHandlers(): Record<
    string,
    (req: Request, res: Response) => void
  > {
    return {
      "/": async (req, res) => {
        const userID = req.params.id;
        if (!userID)
          return res.status(400).json({ error: "User ID is required" });

        const user = this.bot.findUser(userID);

        if (!user) return res.status(404).json({ error: "User not found" });

        const settings = (await this.bot.getModuleData("User", {
          userID,
        })) as UserModuleData;
        if (!settings)
          return res.status(404).json({ error: "User settings not found" });

        res.status(200).json({
          user: {
            id: user.id,
            username: user.username,
            avatar: user.avatarURL(),
            banner: user.bannerURL(),
          }
        });
      },
      "/notifications/vc": async (req, res) => {
        const userID = req.params.id;
        if (!userID)
          return res.status(400).json({ error: "User ID is required" });

        switch (req.method) {
          case "GET": {
            const currentData = await this.bot.getModuleData("User", { userID }) as UserModuleData;

            this.get<"User">(req, res, {
              message: "VC Notification Settings",
              data: { notifications: { vc: currentData.notifications.vc } },
            });
            break;
          }
          case "POST": {
            try {
              const bodyData = this.getBodyData("User", "notifications", req.body) as DeepPartial<UserModuleData["notifications"]>;
              const currentData = await this.bot.getModuleData("User", { userID }) as UserModuleData;

              let value = bodyData.vc;
              if (typeof value !== "boolean") {
                res
                  .status(400)
                  .json({
                    message: "Invalid data format for VC notification status",
                  });
                return;
              }

              currentData.notifications.vc = value;
              const updatedData = await this.updateData(
                {
                  module: "User",
                  ctx: { userID },
                },
                currentData
              );

              this.post<"User">(req, res, {
                message: "VC Notification Settings Updated",
                data: { notifications: { vc: updatedData.notifications.vc } },
              });
            } catch (error) {
              return res.status(500).json({ error: "Failed to update settings" });
            }
          }
          default:
            return res.status(405).json({ error: "Method not allowed" });
        }
      },
    };
  }

  protected async updateData<K extends keyof ModuleDataMap<ContextForKey<K>>>(
    params: { module: K; ctx: Ctx<ContextForKey<K>> },
    data: DeepPartial<ModuleDataMap<ContextForKey<K>>[K]>
  ): Promise<ModuleDataMap<ContextForKey<K>>[K]> {
    const updated = await this.bot.updateModuleData<K>(
      params.module,
      data,
      params.ctx
    );

    return updated as ModuleDataMap<ContextForKey<K>>[K];
  }

  constructor(bot: ExtendedClient, context: T) {
    super(bot, context);
  }
}
