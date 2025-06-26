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
            const bodyData = this.getBodyData("Moderation", "enabled", req.body) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            if (typeof bodyData.enabled !== "boolean") {
              res.status(400).json({ message: "Invalid data format for auto punish status" });
              return;
            }

            currentData.settings.autoPunish.enabled = bodyData.enabled;
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
      "/setinfractionsuntilwarn": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            this.get(req, res, {
              message: "Infractions Until Warn",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilWarn: currentData.settings.autoPunish.infractionsUntilWarn
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to retrieve infractions until warn",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const bodyData = this.getBodyData("Moderation", "infractionsUntilWarn", req.body) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            let value = bodyData.infractionsUntilWarn;

            if (typeof bodyData.infractionsUntilWarn == "string") {
              value = Number(bodyData.infractionsUntilWarn);

              if (isNaN(value)) {
                res.status(400).json({ message: "Invalid data format for infractions until warn" });
                return;
              }
            }

            currentData.settings.autoPunish.infractionsUntilWarn = value as number;
            const updatedData = await this.updateData({ module: "Moderation", guildID }, currentData);
            this.post(req, res, {
              message: "Infractions Until Warn Updated",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilWarn: updatedData.settings.autoPunish.infractionsUntilWarn
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to update infractions until warn",
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
      "/setinfractionsuntilban": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            this.get(req, res, {
              message: "Infractions Until Ban",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilBan: currentData.settings.autoPunish.infractionsUntilBan
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to retrieve infractions until ban",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const bodyData = this.getBodyData("Moderation", "infractionsUntilBan", req.body) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;
            

            if (typeof bodyData.infractionsUntilBan !== "number") {
              res.status(400).json({ message: "Invalid data format for infractions until ban" });
              return;
            }

            currentData.settings.autoPunish.infractionsUntilBan = bodyData.infractionsUntilBan;
            const updatedData = await this.updateData({ module: "Moderation", guildID }, currentData);
            this.post(req, res, {
              message: "Infractions Until Ban Updated",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilBan: updatedData.settings.autoPunish.infractionsUntilBan
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to update infractions until ban",
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
      "/setinfractionsuntilkick": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            this.get(req, res, {
              message: "Infractions Until Kick",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilKick: currentData.settings.autoPunish.infractionsUntilKick
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to retrieve infractions until kick",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const bodyData = this.getBodyData("Moderation", "infractionsUntilKick", req.body) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            if (typeof bodyData.infractionsUntilKick !== "number") {
              res.status(400).json({ message: "Invalid data format for infractions until kick" });
              return;
            }

            currentData.settings.autoPunish.infractionsUntilKick = bodyData.infractionsUntilKick;
            const updatedData = await this.updateData({ module: "Moderation", guildID }, currentData);
            this.post(req, res, {
              message: "Infractions Until Kick Updated",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilKick: updatedData.settings.autoPunish.infractionsUntilKick
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to update infractions until kick",
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
      "/setinfractionsuntiltimeout": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            this.get(req, res, {
              message: "Infractions Until Timeout",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilTimeout: currentData.settings.autoPunish.infractionsUntilTimeout
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to retrieve infractions until timeout",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const bodyData = this.getBodyData("Moderation", "infractionsUntilTimeout", req.body) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
            const currentData = await this.bot.getModuleData("Moderation", guildID) as ModerationModuleData;

            if (typeof bodyData.infractionsUntilTimeout !== "number") {
              res.status(400).json({ message: "Invalid data format for infractions until timeout" });
              return;
            }

            currentData.settings.autoPunish.infractionsUntilTimeout = bodyData.infractionsUntilTimeout;
            const updatedData = await this.updateData({ module: "Moderation", guildID }, currentData);
            this.post(req, res, {
              message: "Infractions Until Timeout Updated",
              data: {
                settings: {
                  autoPunish: {
                    infractionsUntilTimeout: updatedData.settings.autoPunish.infractionsUntilTimeout
                  }
                }
              }
            });
          } catch (error) {
            res.status(500).json({
              message: "Failed to update infractions until timeout",
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        default:
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
      }
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