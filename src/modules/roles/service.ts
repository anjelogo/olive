import { Request, Response } from "express";
import ExtendedClient from "../../Base/Client";
import Service, { InputField } from "../../Base/Service";
import { RolesModuleData } from "../../Database/interfaces/RolesModuleData";

export default class RoleService extends Service {
  protected fields: InputField[] = [
    {
      label: "Role Save on Leave",
      description: "Save the role when the user leaves the server",
      type: "checkbox",
      action: "/saveroles"
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": (req, res) => {
        this.get(req, res, { message: "Role Service is working!" });
      },
      "/saveroles": async (req, res) => {
        try {
          const { guildID } = req.body;
          const currentData = await this.bot.getModuleData("Roles", guildID) as RolesModuleData;

          currentData.savedRoles.enabled = !currentData.savedRoles.enabled;

          const updated = await this.updateData({ guildID }, currentData);

          this.post(req, res, {
            message: `Role Saving has been ${updated.savedRoles.enabled ? "enabled" : "disabled"}`,
            data: updated
          });
        } catch (error) {
          res.status(500).json({ 
            message: "Failed to toggle role saving", 
            error: error instanceof Error ? error.message : "Unknown error"
          });
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