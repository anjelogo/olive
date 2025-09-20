import { Request, Response } from "express";
import { User } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Service, { DeepPartial, InputField } from "../../Base/Service";
import { RolesModuleData } from "../../Database/interfaces/RolesModuleData";
import { ModuleDataMap, ModuleName } from "../../Database/ModuleTypes";

export default class RoleService extends Service {
  protected fields: InputField[] = [
    {
      label: "Save Roles on User Leave",
      description: "Save a user's roles when they leave the server, returning them when they rejoin.",
      type: "checkbox",
      action: "/saveroles",
      module: "Roles",
      permissions: ["roles.web.edit", "roles.save.toggle"],
      data: undefined, // This will be filled dynamically based on the current data,
    }
  ];

  protected getRouteHandlers(): Record<string, (req: Request, res: Response) => void> {
    return {
      "/": async (req, res) => {
  const guildID = req.params.id;
  const currentData = await this.bot.getModuleData("Roles", { guildID }) as RolesModuleData;

        const fields = this.fields.map(field => {
          switch (field.action) {
          case "/saveroles":
            return {
              ...field,
              data: {
                savedRoles: {
                  enabled: currentData.savedRoles.enabled
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
          message: "Role Module Settings",
          data: filteredFields
        });
      },
      "/saveroles": async (req, res) => {
        const guildID = req.params.id;
        if (!await this.bot.getModule("Main").hasPerm(req.user as User, "roles.save.toggle", guildID)) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }

        switch (req.method) {
        case "GET": {
          try {
            const guildID = req.params.id;
            const currentData = await this.bot.getModuleData("Roles", { guildID }) as RolesModuleData;

            this.get(req, res, {
              message: "Role Saving Status",
              data: {
                savedRoles: {
                  enabled: currentData.savedRoles.enabled
                }
              }
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
            const bodyData = this.getBodyData("Roles", "enabled", req.body) as RolesModuleData["savedRoles"];
            const currentData = await this.bot.getModuleData("Roles", { guildID }) as RolesModuleData;

            if (typeof bodyData.enabled !== "boolean") {
              res.status(400).json({ message: "Invalid data for role saving" });
              return;
            }

            currentData.savedRoles.enabled = bodyData.enabled;
            const updatedData = await this.updateData({
              guildID,
              module: "Roles"
            }, currentData);

            this.post(req, res, {
              message: "Role saving status updated",
              data: {
                savedRoles: {
                  enabled: updatedData.savedRoles.enabled
                }
              }
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

  protected async updateData<K extends keyof ModuleDataMap>(
    params: { module: K; guildID: string },
    data: DeepPartial<ModuleDataMap[K]>
  ): Promise<ModuleDataMap[K]> {
    const rolesData = data as DeepPartial<RolesModuleData>;
    if (!rolesData.roles) {
      rolesData.roles = [];
    }
    return await this.bot.updateModuleData<"Roles">("Roles", rolesData as ModuleDataMap["Roles"], { guildID: params.guildID }) as ModuleDataMap[K];
  }

  constructor(bot: ExtendedClient) {
    super(bot);
  }
}