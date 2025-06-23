import { Request, Response } from "express";
import ExtendedClient from "../../Base/Client";
import Service, { DeepPartial, InputField } from "../../Base/Service";
import { ModuleDataMap, ModuleName } from "../../Database/ModuleTypes";
import { ModerationModuleData } from "../../Database/interfaces/ModerationModuleData";

export default class ModerationService extends Service {
  protected fields: InputField[] = [
    {
      label: "Automatically Punish Users on Infractions",
      description: "Enable or disable automatic punishment for users based on infractions",
      type: "checkbox",
      action: "/autopunish",
      module: "Moderation",
      permissions: ["moderation.settings.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    }, {
      label: "Infractions Until Warn",
      description: "Set the number of infractions before a user is warned",
      type: "number",
      action: "/setinfractionsuntilwarn",
      module: "Moderation",
      permissions: ["moderation.settings.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    }, {
      label: "Infractions Until Ban",
      description: "Set the number of infractions before a user is banned",
      type: "number",
      action: "/setinfractionsuntilban",
      module: "Moderation",
      permissions: ["moderation.settings.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    }, {
      label: "Infractions Until Kick",
      description: "Set the number of infractions before a user is kicked",
      type: "number",
      action: "/setinfractionsuntilkick",
      module: "Moderation",
      permissions: ["moderation.settings.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    }, {
      label: "Infractions Until Timeout",
      description: "Set the number of infractions before a user is timed out",
      type: "number",
      action: "/setinfractionsuntiltimeout",
      module: "Moderation",
      permissions: ["moderation.settings.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
        const guildID = req.params.id;
        const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

        const fields = this.fields.map(field => {
          switch (field.action) {
          case "/autopunish":
            return {
              ...field,
              data: {
                settings: {
                  autoPunish: {
                    enabled: currentData.settings.autoPunish.enabled
                  }
                }
              }
            } as InputField;
          case "/setinfractionsuntilwarn":
            return {
              ...field,
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilWarn: currentData.settings.autoPunish.infractionsUntilWarn
                  }
                }
              }
            } as InputField;
          case "/setinfractionsuntilban":
            return {
              ...field,
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilBan: currentData.settings.autoPunish.infractionsUntilBan
                  }
                }
              }
            } as InputField;
          case "/setinfractionsuntilkick":
            return {
              ...field,
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilKick: currentData.settings.autoPunish.infractionsUntilKick
                  }
                }
              }
            } as InputField;
          case "/setinfractionsuntiltimeout":
            return {
              ...field,
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilTimeout: currentData.settings.autoPunish.infractionsUntilTimeout
                  }
                }
              }
            } as InputField;
          default:
            return field;
          }
        });

        this.get(req, res, {
          message: "Moderation Module Settings",
          data: fields
        });
      },
      "/autopunish": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            this.get(req, res, {
              message: "Auto Punish Status",
              data: {
                settings: {
                  autoPunish: {
                    enabled: currentData.settings.autoPunish.enabled
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to retrieve auto punish status",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;
            const body = req.body as DeepPartial<ModerationModuleData>;

            if (typeof body.settings?.autoPunish?.enabled !== "boolean") {
              res.status(400).json({ message: "Invalid data format for auto punish status" });
              return;
            }

            currentData.settings.autoPunish.enabled = body.settings.autoPunish.enabled;
            const updatedData = await this.updateData({ module: "Moderation", guildID }, currentData);
            this.post(req, res, {
              message: "Auto Punish Status Updated",
              data: updatedData.settings.autoPunish
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to update auto punish status",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        default:
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
      },
    };
  }

  protected async updateData<K extends ModuleName>(
    params: { module: K; guildID: string },
    data: DeepPartial<ModuleDataMap[K]>
  ): Promise<ModuleDataMap[K]> {
    const moderationData = data as DeepPartial<ModerationModuleData>;
    return this.bot.updateModuleData<"Moderation">("Moderation", moderationData as ModuleDataMap["Moderation"], params.guildID) as Promise<ModuleDataMap[K]>;
  }

  constructor(bot: ExtendedClient) {
    super(bot);
  }
}