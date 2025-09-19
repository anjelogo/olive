import { Constants, Guild, User } from "oceanic.js";
import { generate } from "@pwldev/discord-snowflake";
import ExtendedClient from "../../../Base/Client";
import { Case, CaseActionTypes, ModerationModuleData } from "../../../Database/interfaces/ModerationModuleData"; 
import { updateLogEntry } from "./logHandler";
import { durationToMS } from "./durationHandler";

export function generateCase(action: "ban" | "timeout", memberToPunishID: string, moderatorID: string, duration: string | null, reason?: string): Case;
export function generateCase(action: "kick" | "warn", memberToPunishID: string, moderatorID: string, duration?: undefined, reason?: string): Case;
export function generateCase(action: CaseActionTypes, memberToPunishID: string, moderatorID: string, duration?: string | null, reason?: string): Case {
  if (!["ban", "timeout", "kick", "warn"].includes(action)) {
    throw new Error("Invalid action type. Must be one of: ban, timeout, kick, warn.");
  }

  const baseCase = {
    id: generate(Date.now()).toString(),
    action,
    userID: memberToPunishID,
    moderatorID,
    reason: reason ?? "No reason provided.",
    resolved: undefined,
    timestamp: new Date().toISOString()
  };

  if (action === "ban" || action === "timeout") {
    const caseData: Case = {
      ...baseCase,
      action: action as "ban" | "timeout", // Narrowing the type explicitly
      duration: null,
      expiresAt: null
    };

    if (duration) {
      const ms = durationToMS(duration) as number;
      caseData.duration = duration;
      caseData.expiresAt = new Date(Date.now() + ms).toISOString();
    }

    return caseData as Case;
  } else {
    return baseCase as Case;
  }
}

export async function getCases(bot: ExtendedClient, guild: Guild, userID: string, caseID?: string): Promise<Case[]> {
  const data = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!data) return [];

  if (caseID) {
    return data.cases.filter((c) => c.id === caseID);
  }
  else {
    return data.cases.filter((c) => c.userID === userID);
  }
}

export async function addCase(bot: ExtendedClient, guild: Guild, caseData: Case): Promise<void> {
  const data = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!data) return;

  data.cases ? data.cases.push(caseData) : data.cases = [caseData];

  try {
    await bot.updateModuleData("Moderation", data, guild);
  } catch (e) {
    throw new Error("Could not update data");
  }
}

export async function removeCase(bot: ExtendedClient, guild: Guild, caseID: string): Promise<void> {
  const data = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!data) return;

  data.cases = data.cases.filter((c) => c.id !== caseID);

  try {
    await bot.updateModuleData("Moderation", data, guild);
  } catch (e) {
    throw new Error("Could not update data");
  }
}

export async function resolveCase(bot: ExtendedClient, guild: Guild, caseID: string, moderatorID: string, reason: string): Promise<boolean> {
  const data = await bot.getModuleData("Moderation", { guildID: guild.id }) as ModerationModuleData;

  if (!data) return false;

  if (!data.cases.length) return false;

  const caseToResolve = data.cases.find((c) => c.id === caseID);

  if (!caseToResolve) return false;

  caseToResolve.resolved = {
    moderatorID,
    reason
  };

  try {
    switch (caseToResolve.action) {
    case "timeout":
      caseToResolve.duration = null;
      guild.members.get(caseToResolve.userID)?.edit({
        communicationDisabledUntil: undefined
      });
      break;
    case "ban":
      guild.removeBan(caseToResolve.userID, reason).catch((error) => {
      // Log the error or handle it appropriately
        console.error(`Failed to remove ban for user ${caseToResolve.userID}:`, error);
      });
      break;
    }

    await updateLogEntry(bot, guild, caseToResolve);
    await bot.updateModuleData("Moderation", data, guild);

    const user = bot.findUser(caseToResolve.userID) as User;
    if (!user) return false;
    const dmChannel = await user.createDM();
    if (dmChannel) {
      dmChannel.createMessage({
        components: [{
          type: Constants.ComponentTypes.CONTAINER,
          components: [
            {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `## Your case has been resolved by <@${moderatorID}>`
            }, {
              type: Constants.ComponentTypes.SEPARATOR,
              spacing: Constants.SeparatorSpacingSize.LARGE,
              divider: false
            }, {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: "### Reason:"
            }, {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: reason ?? "No reason provided."
            }, {
              type: Constants.ComponentTypes.SEPARATOR,
              divider: true,
              spacing: Constants.SeparatorSpacingSize.LARGE
            }, {
              type: Constants.ComponentTypes.TEXT_DISPLAY,
              content: `${bot.constants.emojis.administrator} <t:${Math.floor(Date.now() / 1000)}:f> • ||Case: ${caseToResolve.id}||`
            }
          ]
        }],
        flags: Constants.MessageFlags.IS_COMPONENTS_V2
      }).catch(() => {
        // ignore error
      });
    }

    return true;
  } catch (e) {
    throw new Error(`Could not resolve case: ${e}`);
  }
}