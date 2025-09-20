import { Request, Response } from "express";
import { User } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Service, { ContextForKey, Ctx, DeepPartial, InputField } from "../../Base/Service";
import { ModuleDataMap, ModuleName } from "../../Database/ModuleTypes";
import { VCModuleData } from "../../Database/interfaces/VCModuleData";

export default class VCService<T extends "guild"> extends Service<T> {
  protected fields: InputField[] = [
    {
      label: "Default Channel Name",
      description: "Set the default name for new private voice channels created by the bot.",
      type: "list_input",
      action: "/defaultchannelname",
      module: "VC",
      permissions: ["vc.web.edit", "vc.edit.name"],
      data: undefined, // This will be filled dynamically based on the current data,
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
  const guildID = req.params.id;
  const currentData = await this.bot.getModuleData("VC", { guildID }) as VCModuleData;

        const fields = this.fields.map(field => {
          switch (field.action) {
          case "/defaultchannelname":
            return {
              ...field,
              data: {
                defaultName: {
                  channel: currentData.defaultName.channel || ["{user}'s Private Channel"]
                }
              }
            } as InputField;
          default:
            return field;
          }
        });

        // Filter out fields that the user doesn't have permission for
        const filteredFields = [];
        for (const field of fields) {
          let hasAllPerms = true;
          for (const perm of field.permissions) {
            const hasPerm = await this.bot.getModule("Main").hasPerm(req.user as User, perm, guildID);
            if (!hasPerm) {
              hasAllPerms = false;
              break;
            }
          }
          if (hasAllPerms) {
            filteredFields.push(field);
          }
        }

        this.get(req, res, {
          message: "VC Module Settings",
          data: filteredFields
        });
      },
      "/defaultchannelname": async (req, res) => {
        const guildID = req.params.id;
        if (!await this.bot.getModule("Main").hasPerm(req.user as User, "vc.edit.name", guildID)) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }

        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("VC", { guildID }) as VCModuleData;

            this.get<"VC">(req, res, {
              message: "Default Channel Name",
              data: {
                defaultName: {
                  channel: currentData.defaultName.channel || ["{user}'s Private Channel"]
                }
              }
            });
          } catch (err) {
            res.status(500).json({
              messsage: "Failed to retrieve default channel name",
              error: err instanceof Error ? err.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const bodyData = this.getBodyData("VC", "channel", req.body) as VCModuleData["defaultName"];
            const currentData = await this.bot.getModuleData("VC", { guildID }) as VCModuleData;

            if (!Array.isArray(bodyData.channel)) {
              res.status(400).json({ message: "Invalid data format for default name" });
              return;
            }

            currentData.defaultName.channel = bodyData.channel;
            await this.updateData({ module: "VC", ctx: { guildID } }, currentData);

            this.post<"VC">(req, res, {
              message: "Default Channel Name Updated",
              data: {
                defaultName: {
                  channel: currentData.defaultName.channel
                }
              }
            });
          } catch (err) {
            res.status(500).json({
              message: "Failed to update default channel name",
              error: err instanceof Error ? err.message : "Unknown error"
            });
          }
          break;
        }
        default:
          res.status(405).json({ message: "Method not allowed." });
        }
      }
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