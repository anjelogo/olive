import { Request, Response } from "express";
import { Guild, User } from "oceanic.js";
import ExtendedClient from "../../Base/Client";
import Service, {
  ContextForKey,
  Ctx,
  DeepPartial,
  InputField,
} from "../../Base/Service";
import { ModuleDataMap, ModuleName } from "../../Database/ModuleTypes";
import { ModerationModuleData } from "../../Database/interfaces/ModerationModuleData";
import { deleteAutoModRule, Presets, synchroniseAutoModRules, synchroniseBucketRules } from "./internals/autoModHandler";
import { validateDuration } from "./internals/durationHandler";

export default class ModerationService<T extends "guild"> extends Service<T> {
  protected readonly context: T = "guild" as T;

  protected fields: InputField[] = [
    {
      label: "Automatically Punish Users on Infractions",
      description:
        "Enable or disable automatic punishment for users based on infractions",
      type: "checkbox",
      action: "/autopunish",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Infractions Until Warn",
      description: "Set the number of infractions before a user is warned",
      type: "number",
      action: "/setinfractionsuntilwarn",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Infractions Until Ban",
      description: "Set the number of infractions before a user is banned",
      type: "number",
      action: "/setinfractionsuntilban",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Infractions Until Kick",
      description: "Set the number of infractions before a user is kicked",
      type: "number",
      action: "/setinfractionsuntilkick",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Infractions Until Timeout",
      description: "Set the number of infractions before a user is timed out",
      type: "number",
      action: "/setinfractionsuntiltimeout",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Enable Discord Auto-Moderation",
      description: "Enable or disable Discord's built-in auto-moderation",
      type: "checkbox",
      action: "/setdiscordautomod",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
    {
      label: "Auto-Moderation Rules",
      description: "Discord Auto-Moderation Rules",
      type: "custom",
      action: "/automodrules",
      module: "Moderation",
      permissions: ["moderation.web.edit"],
      data: undefined, // This will be filled dynamically based on the current data,
    },
  ];

  protected getRouteHandlers(): Record<
    string,
    (req: Request, res: Response) => void
  > {
    return {
      "/": async (req, res) => {
        const guildID = req.params.id;
        const currentData = (await this.bot.getModuleData("Moderation", {
          guildID,
        })) as ModerationModuleData;

        const fields = this.fields.map((field) => {
          switch (field.action) {
            case "/autopunish":
              return {
                ...field,
                data: {
                  settings: {
                    autoPunish: {
                      enabled: currentData.settings.autoPunish.enabled,
                    },
                  },
                },
              } as InputField;
            case "/setinfractionsuntilwarn":
              return {
                ...field,
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilWarn:
                        currentData.settings.autoPunish.infractionsUntilWarn,
                    },
                  },
                },
              } as InputField;
            case "/setinfractionsuntilban":
              return {
                ...field,
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilBan:
                        currentData.settings.autoPunish.infractionsUntilBan,
                    },
                  },
                },
              } as InputField;
            case "/setinfractionsuntilkick":
              return {
                ...field,
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilKick:
                        currentData.settings.autoPunish.infractionsUntilKick,
                    },
                  },
                },
              } as InputField;
            case "/setinfractionsuntiltimeout":
              return {
                ...field,
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilTimeout:
                        currentData.settings.autoPunish.infractionsUntilTimeout,
                    },
                  },
                },
              } as InputField;
            case "/setdiscordautomod":
              return {
                ...field,
                data: {
                  settings: {
                    autoModeration: {
                      enabled: currentData.settings.autoModeration.enabled,
                    },
                  },
                },
              } as InputField;
            case "/automodrules": {
              return {
                ...field,
                options: Object.keys(Presets).map((key) => ({
                  label: Presets[key].name,
                  value: key,
                })),
                data: {
                  settings: {
                    autoModeration: {
                      rules: currentData.settings.autoModeration.rules,
                    },
                  },
                },
              } as InputField;
            }
            default:
              return field;
          }
        });

        // Filter out fields that the user doesn't have permission for
        const filteredFields = [];
        for (const field of fields) {
          let hasAllPerms = true;
          for (const perm of field.permissions) {
            const hasPerm = await this.bot
              .getModule("Main")
              .hasPerm(req.user as User, perm, guildID);
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
          message: "Moderation Module Settings",
          data: filteredFields,
        });
      },
      "/autopunish": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const guildID = req.params.id;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              this.get<"Moderation">(req, res, {
                message: "Auto Punish Status",
                data: {
                  settings: {
                    autoPunish: {
                      enabled: currentData.settings.autoPunish.enabled,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve auto punish status",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const guildID = req.params.id;
              const bodyData = this.getBodyData(
                "Moderation",
                "enabled",
                req.body
              ) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              if (typeof bodyData.enabled !== "boolean") {
                res.status(400).json({
                  message: "Invalid data format for auto punish status",
                });
                return;
              }

              currentData.settings.autoPunish.enabled = bodyData.enabled;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );

              this.post<"Moderation">(req, res, {
                message: "Auto Punish Status Updated",
                data: {
                  settings: {
                    autoPunish: {
                      enabled: updatedData.settings.autoPunish.enabled,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update auto punish status",
                error: error instanceof Error ? error.message : "Unknown error",
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
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const guildID = req.params.id;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              this.get<"Moderation">(req, res, {
                message: "Infractions Until Warn",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilWarn:
                        currentData.settings.autoPunish.infractionsUntilWarn,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve infractions until warn",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const guildID = req.params.id;
              const bodyData = this.getBodyData(
                "Moderation",
                "infractionsUntilWarn",
                req.body
              ) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              let value = bodyData.infractionsUntilWarn;

              if (typeof bodyData.infractionsUntilWarn == "string") {
                value = Number(bodyData.infractionsUntilWarn);

                if (isNaN(value)) {
                  res.status(400).json({
                    message: "Invalid data format for infractions until warn",
                  });
                  return;
                }
              }

              currentData.settings.autoPunish.infractionsUntilWarn =
                value as number;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Infractions Until Warn Updated",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilWarn:
                        updatedData.settings.autoPunish.infractionsUntilWarn,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update infractions until warn",
                error: error instanceof Error ? error.message : "Unknown error",
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
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const guildID = req.params.id;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              this.get<"Moderation">(req, res, {
                message: "Infractions Until Ban",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilBan:
                        currentData.settings.autoPunish.infractionsUntilBan,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve infractions until ban",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const guildID = req.params.id;
              const bodyData = this.getBodyData(
                "Moderation",
                "infractionsUntilBan",
                req.body
              ) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              let value = bodyData.infractionsUntilBan;

              if (typeof bodyData.infractionsUntilBan == "string") {
                value = Number(bodyData.infractionsUntilBan);

                if (isNaN(value)) {
                  res.status(400).json({
                    message: "Invalid data format for infractions until warn",
                  });
                  return;
                }
              }

              currentData.settings.autoPunish.infractionsUntilBan =
                value as number;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Infractions Until Ban Updated",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilBan:
                        updatedData.settings.autoPunish.infractionsUntilBan,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update infractions until ban",
                error: error instanceof Error ? error.message : "Unknown error",
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
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const guildID = req.params.id;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              this.get<"Moderation">(req, res, {
                message: "Infractions Until Kick",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilKick:
                        currentData.settings.autoPunish.infractionsUntilKick,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve infractions until kick",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const guildID = req.params.id;
              const bodyData = this.getBodyData(
                "Moderation",
                "infractionsUntilKick",
                req.body
              ) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              let value = bodyData.infractionsUntilKick;

              if (typeof bodyData.infractionsUntilKick == "string") {
                value = Number(bodyData.infractionsUntilKick);

                if (isNaN(value)) {
                  res.status(400).json({
                    message: "Invalid data format for infractions until warn",
                  });
                  return;
                }
              }

              currentData.settings.autoPunish.infractionsUntilKick =
                value as number;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Infractions Until Kick Updated",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilKick:
                        updatedData.settings.autoPunish.infractionsUntilKick,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update infractions until kick",
                error: error instanceof Error ? error.message : "Unknown error",
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
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              this.get<"Moderation">(req, res, {
                message: "Infractions Until Timeout",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilTimeout:
                        currentData.settings.autoPunish.infractionsUntilTimeout,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve infractions until timeout",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const bodyData = this.getBodyData(
                "Moderation",
                "infractionsUntilTimeout",
                req.body
              ) as DeepPartial<ModerationModuleData["settings"]["autoPunish"]>;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              let value = bodyData.infractionsUntilTimeout;

              if (typeof bodyData.infractionsUntilTimeout == "string") {
                value = Number(bodyData.infractionsUntilTimeout);

                if (isNaN(value)) {
                  res.status(400).json({
                    message: "Invalid data format for infractions until warn",
                  });
                  return;
                }
              }

              currentData.settings.autoPunish.infractionsUntilTimeout =
                value as number;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Infractions Until Timeout Updated",
                data: {
                  settings: {
                    autoPunish: {
                      infractionsUntilTimeout:
                        updatedData.settings.autoPunish.infractionsUntilTimeout,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update infractions until timeout",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          default:
            res.status(405).json({ message: "Method not allowed" });
            return;
        }
      },
      "/setdiscordautomod": async (req, res) => {
        const guildID = req.params.id;

        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }
        switch (req.method) {
          case "GET": {
            try {
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;
              this.get<"Moderation">(req, res, {
                message: "Discord Auto-Moderation Status",
                data: {
                  settings: {
                    autoModeration: {
                      enabled: currentData.settings.autoModeration.enabled,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve discord auto-moderation status",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const bodyData = this.getBodyData(
                "Moderation",
                "enabled",
                req.body
              ) as DeepPartial<
                ModerationModuleData["settings"]["autoModeration"]
              >;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;
              if (typeof bodyData.enabled !== "boolean") {
                res.status(400).json({
                  message:
                    "Invalid data format for discord auto-moderation status",
                });
                return;
              }
              currentData.settings.autoModeration.enabled = bodyData.enabled;
              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Discord Auto-Moderation Status Updated",
                data: {
                  settings: {
                    autoModeration: {
                      enabled: updatedData.settings.autoModeration.enabled,
                    },
                  },
                },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to update discord auto-moderation status",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          default:
            res.status(405).json({ message: "Method not allowed" });
            return;
        }
      },
      "/automodrules": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET":
            {
              try {
                const currentData = (await this.bot.getModuleData(
                  "Moderation",
                  {
                    guildID,
                  }
                )) as ModerationModuleData;
                this.get<"Moderation">(req, res, {
                  message: "Discord Auto-Moderation Rules",
                  data: {
                    options: Object.keys(Presets).map((key) => ({
                      label: Presets[key].name,
                      value: key,
                    })),
                    settings: {
                      autoModeration: {
                        rules: currentData.settings.autoModeration.rules,
                      },
                    },
                  },
                });
              } catch (error) {
                res.status(500).json({
                  message: "Failed to update discord auto-moderation status",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                });
              }
            }
            break;
          case "POST": {
            try {
              const bodyData = this.getBodyData(
                "Moderation",
                "rules",
                req.body
              ) as DeepPartial<
                ModerationModuleData["settings"]["autoModeration"]
              >;
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;
              if (!Array.isArray(bodyData.rules)) {
                res.status(400).json({
                  message:
                    "Invalid data format for discord auto-moderation rules",
                });
                return;
              }

              currentData.settings.autoModeration.rules =
                bodyData.rules as typeof currentData.settings.autoModeration.rules;

              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );
              this.post<"Moderation">(req, res, {
                message: "Discord Auto-Moderation Rules Updated",
                data: {
                  settings: {
                    autoModeration: {
                      rules: updatedData.settings.autoModeration.rules,
                    },
                  },
                },
              });

              // Synchronise the rules with Discord
              await synchroniseAutoModRules(
                this.bot,
                this.bot.findGuild(guildID) as Guild
              );
              await synchroniseBucketRules(
                this.bot,
                this.bot.findGuild(guildID) as Guild
              );
            } catch (error) {
              res.status(500).json({
                message: "Failed to update discord auto-moderation rules",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "PATCH": {
            try {
              const { id, enabled, action, actionDuration, actionSilent } = req.body;
              if (!id) {
                res.status(400).json({ message: "Rule id required" });
                return;
              }
              const validActions = ["ban", "kick", "timeout", "warn"];
              if (action !== undefined && !validActions.includes(action)) {
                res.status(400).json({ message: "Invalid action. Must be one of: ban, kick, timeout, warn" });
                return;
              }
              if (actionDuration !== undefined && actionDuration !== null) {
                if (typeof actionDuration !== "string" || !validateDuration(actionDuration)) {
                  res.status(400).json({ message: "Invalid actionDuration (e.g. '10m', '1h', '7d')" });
                  return;
                }
              }
              if (actionSilent !== undefined && typeof actionSilent !== "boolean") {
                res.status(400).json({ message: "actionSilent must be a boolean" });
                return;
              }
              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;
              const rule = currentData.settings.autoModeration.rules.find(r => r.id === id);
              if (!rule) {
                res.status(404).json({ message: "Rule not found" });
                return;
              }
              if (typeof enabled === "boolean") rule.enabled = enabled;
              if (action) rule.action = action;
              if (actionDuration !== undefined) rule.actionDuration = actionDuration;
              if (actionSilent !== undefined) rule.actionSilent = actionSilent;
              await this.updateData({ module: "Moderation", ctx: { guildID } }, currentData);
              this.post<"Moderation">(req, res, {
                message: "Rule updated",
                data: { settings: { autoModeration: { rules: currentData.settings.autoModeration.rules } } },
              });
              await synchroniseAutoModRules(this.bot, this.bot.findGuild(guildID) as Guild);
            } catch (error) {
              res.status(500).json({
                message: "Failed to update rule",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "DELETE": {
            try {
              const { id } = req.body;
              if (!id) {
                res.status(400).json({ message: "Rule id required" });
                return;
              }
              const deleted = await deleteAutoModRule(this.bot, this.bot.findGuild(guildID) as Guild, id);
              if (!deleted) {
                res.status(404).json({ message: "Rule not found or could not be deleted" });
                return;
              }
              res.status(200).json({ message: "Rule deleted" });
            } catch (error) {
              res.status(500).json({
                message: "Failed to delete rule",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          default:
            res.status(405).json({ message: "Method not allowed" });
            return;
        }
      },
      "/automodrules/sync": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }
        if (req.method !== "POST") {
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
        try {
          await synchroniseAutoModRules(this.bot, this.bot.findGuild(guildID) as Guild);
          await synchroniseBucketRules(this.bot, this.bot.findGuild(guildID) as Guild);
          const currentData = (await this.bot.getModuleData("Moderation", { guildID })) as ModerationModuleData;
          res.status(200).json({ message: "Sync complete", data: { ruleCount: currentData.settings.autoModeration.rules.length } });
        } catch (error) {
          res.status(500).json({
            message: "Failed to sync rules",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
      "/customphrases": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({
            message: "You do not have permission to access this endpoint.",
          });
          return;
        }

        switch (req.method) {
          case "GET": {
            try {
              const currentData = (await this.bot.getModuleData("Moderation", { guildID })) as ModerationModuleData;
              this.get<"Moderation">(req, res, {
                message: "Custom phrases",
                data: { settings: { autoModeration: { customPhrases: currentData.settings.autoModeration.customPhrases } } },
              });
            } catch (error) {
              res.status(500).json({
                message: "Failed to retrieve custom phrases",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          case "POST": {
            try {
              const { bucket, phrases } = req.body;
              const validBuckets = ["contact", "giveaway", "payment", "spam"];

              if (!validBuckets.includes(bucket)) {
                res.status(400).json({ message: "Invalid bucket. Must be one of: contact, giveaway, payment, spam" });
                return;
              }
              if (!Array.isArray(phrases)) {
                res.status(400).json({ message: "phrases must be an array" });
                return;
              }
              if (phrases.length > 100) {
                res.status(400).json({ message: "Maximum 100 custom phrases per bucket" });
                return;
              }

              const currentData = (await this.bot.getModuleData("Moderation", {
                guildID,
              })) as ModerationModuleData;

              currentData.settings.autoModeration.customPhrases = {
                ...currentData.settings.autoModeration.customPhrases,
                [bucket]: phrases,
              };

              const updatedData = await this.updateData(
                { module: "Moderation", ctx: { guildID } },
                currentData
              );

              this.post<"Moderation">(req, res, {
                message: "Custom phrases updated",
                data: {
                  settings: {
                    autoModeration: {
                      customPhrases: updatedData.settings.autoModeration.customPhrases,
                    },
                  },
                },
              });

              await synchroniseBucketRules(
                this.bot,
                this.bot.findGuild(guildID) as Guild
              );
            } catch (error) {
              res.status(500).json({
                message: "Failed to update custom phrases",
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
            break;
          }
          default:
            res.status(405).json({ message: "Method not allowed" });
            return;
        }
      },
      "/customphrases/add": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }
        if (req.method !== "POST") {
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
        try {
          const { bucket, phrase } = req.body;
          const validBuckets = ["contact", "giveaway", "payment", "spam"];
          if (!validBuckets.includes(bucket)) {
            res.status(400).json({ message: "Invalid bucket. Must be one of: contact, giveaway, payment, spam" });
            return;
          }
          if (typeof phrase !== "string" || !phrase.trim()) {
            res.status(400).json({ message: "phrase must be a non-empty string" });
            return;
          }
          const currentData = (await this.bot.getModuleData("Moderation", { guildID })) as ModerationModuleData;
          const existing = currentData.settings.autoModeration.customPhrases?.[bucket as keyof typeof currentData.settings.autoModeration.customPhrases] ?? [];
          if (existing.length >= 100) {
            res.status(400).json({ message: "Maximum 100 custom phrases per bucket" });
            return;
          }
          const normalized = phrase.trim().toLowerCase();
          if (existing.includes(normalized)) {
            res.status(400).json({ message: "Phrase already exists in bucket" });
            return;
          }
          currentData.settings.autoModeration.customPhrases = {
            ...currentData.settings.autoModeration.customPhrases,
            [bucket]: [...existing, normalized],
          };
          const updatedData = await this.updateData({ module: "Moderation", ctx: { guildID } }, currentData);
          this.post<"Moderation">(req, res, {
            message: "Phrase added",
            data: { settings: { autoModeration: { customPhrases: updatedData.settings.autoModeration.customPhrases } } },
          });
          await synchroniseBucketRules(this.bot, this.bot.findGuild(guildID) as Guild);
        } catch (error) {
          res.status(500).json({
            message: "Failed to add phrase",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
      "/customphrases/remove": async (req, res) => {
        const guildID = req.params.id;
        if (
          !(await this.bot
            .getModule("Main")
            .hasPerm(req.user as User, "moderation.web.edit", guildID))
        ) {
          res.status(403).json({ message: "You do not have permission to access this endpoint." });
          return;
        }
        if (req.method !== "POST") {
          res.status(405).json({ message: "Method not allowed" });
          return;
        }
        try {
          const { bucket, phrase } = req.body;
          const validBuckets = ["contact", "giveaway", "payment", "spam"];
          if (!validBuckets.includes(bucket)) {
            res.status(400).json({ message: "Invalid bucket. Must be one of: contact, giveaway, payment, spam" });
            return;
          }
          if (typeof phrase !== "string" || !phrase.trim()) {
            res.status(400).json({ message: "phrase must be a non-empty string" });
            return;
          }
          const currentData = (await this.bot.getModuleData("Moderation", { guildID })) as ModerationModuleData;
          const existing = currentData.settings.autoModeration.customPhrases?.[bucket as keyof typeof currentData.settings.autoModeration.customPhrases] ?? [];
          const normalized = phrase.trim().toLowerCase();
          const filtered = existing.filter(p => p !== normalized);
          if (filtered.length === existing.length) {
            res.status(404).json({ message: "Phrase not found in bucket" });
            return;
          }
          currentData.settings.autoModeration.customPhrases = {
            ...currentData.settings.autoModeration.customPhrases,
            [bucket]: filtered,
          };
          const updatedData = await this.updateData({ module: "Moderation", ctx: { guildID } }, currentData);
          this.post<"Moderation">(req, res, {
            message: "Phrase removed",
            data: { settings: { autoModeration: { customPhrases: updatedData.settings.autoModeration.customPhrases } } },
          });
          await synchroniseBucketRules(this.bot, this.bot.findGuild(guildID) as Guild);
        } catch (error) {
          res.status(500).json({
            message: "Failed to remove phrase",
            error: error instanceof Error ? error.message : "Unknown error",
          });
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
