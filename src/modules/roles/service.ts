import { Request, Response } from "express";
import ExtendedClient from "../../Base/Client";
import Service, { InputField } from "../../Base/Service";
import { RolesModuleData } from "../../Database/interfaces/RolesModuleData";

export default class RoleService extends Service {
  protected fields: InputField[] = [
    {
      label: "Save Roles on User Leave",
      description: "Save a user's roles when they leave the server, returning them when they rejoin.",
      type: "checkbox",
      action: "/saveroles"
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
        const guildID = req.params.id;
        const currentData = await this.bot.getModuleData("Roles", guildID) as RolesModuleData;

        const fields = this.fields.map(field => {
          switch (field.action) {
          case "/saveroles":
            return {
              ...field,
              currentValue: currentData.savedRoles.enabled
            } as InputField;
          default:
            return field;
          }
        });

        this.get(req, res, {
          message: "Role Module Settings",
          data: {
            fields
          }
        });
      },
      "/saveroles": async (req, res) => {
        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Roles", guildID) as RolesModuleData;

            this.get(req, res, {
              message: "Role Saving Status",
              data: currentData.savedRoles.enabled
            });
          } catch (error) {
            res.status(500).json({ 
              message: "Failed to retrieve role saving status", 
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          break;
        }
        case "POST": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Roles", guildID) as RolesModuleData;

            currentData.savedRoles.enabled = !currentData.savedRoles.enabled;

            const updated = await this.updateData({ guildID }, currentData);

            this.post(req, res, {
              message: `Role Saving has been ${updated.savedRoles.enabled ? "enabled" : "disabled"}`,
              data: currentData.savedRoles.enabled
            });
          } catch (error) {
            res.status(500).json({ 
              message: "Failed to toggle role saving", 
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
          return;
        }
        default: {
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
        }
      }
    };
  }

  protected async updateData(params: any, data: Partial<RolesModuleData>): Promise<RolesModuleData> {
    if (!data.roles) {
      data.roles = [];
    }
    return this.bot.updateModuleData("Roles", data as RolesModuleData, params.guildID);
  }

  constructor(bot: ExtendedClient) {
    super(bot);
  }
}