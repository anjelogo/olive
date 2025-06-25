import { Request, Response } from "express";
import { User } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Service, { DeepPartial, InputField } from "../../Base/Service";
import { ModuleDataMap, ModuleName } from "../../Database/ModuleTypes";
import { VCModuleData } from "../../Database/interfaces/VCModuleData";

export default class VCService extends Service {
  protected fields: InputField[] = [
    {
      label: "Default Channel Name",
      description: "Set the default name for new private voice channels created by the bot.",
      type: "short_input",
      action: "/defaultchannelname",
      module: "VC",
      permissions: ["vc.edit.name"],
      data: undefined, // This will be filled dynamically based on the current data,
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
        const guildID = req.params.id;
        const currentData = await this.bot.getModuleData("VC", guildID) as VCModuleData;

        const fields = this.fields.map(field => {
          switch (field.action) {
          case "/defaultchannelname":
            return {
              ...field,
              data: {
                defaultName: {
                  channel: currentData.defaultName.channel || "{user}'s Private Channel"
                }
              }
            } as InputField;
          default:
            return field;
          }
        });

        this.get(req, res, {
          message: "VC Module Settings",
          data: fields
        });
      },
      "/defaultchannelname": async (req, res) => {
        if (await this.bot.getModule("Main").hasPerm(req.user as User, "vc.edit.name")) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }

        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("VC", guildID) as VCModuleData;

            this.get(req, res, {
              message: "Default Channel Name",
              data: {
                defaultName: {
                  channel: currentData.defaultName.channel || "{user}'s Private Channel"
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
            const currentData = await this.bot.getModuleData("VC", guildID) as VCModuleData;

            currentData.defaultName.channel = bodyData.channel;
            await this.updateData({ module: "VC", guildID }, currentData);

            this.post(req, res, {
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

  protected async updateData<K extends ModuleName>(
    params: { module: K; guildID: string },
    data: DeepPartial<ModuleDataMap[K]>
  ): Promise<ModuleDataMap[K]> {
    const rolesData = data as DeepPartial<VCModuleData>;
    return this.bot.updateModuleData<"VC">("VC", rolesData as ModuleDataMap["VC"], params.guildID) as Promise<ModuleDataMap[K]>;
  }

  constructor(bot: ExtendedClient) {
    super(bot);
  }
}