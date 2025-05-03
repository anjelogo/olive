import { Constants, Guild, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { Case, moduleData } from "../main";
import { updateLogEntry } from "./logHandler";

export async function getCases(bot: ExtendedClient, guild: Guild, userID: string, caseID?: string): Promise<Case[]> {
  const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

  if (!data) return [];

  if (caseID) {
    return data.cases.filter((c) => c.id === caseID);
  }
  else {
    return data.cases.filter((c) => c.userID === userID);
  }
}

export async function addCase(bot: ExtendedClient, guild: Guild, caseData: Case): Promise<void> {
  const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

  if (!data) return;

  data.cases ? data.cases.push(caseData) : data.cases = [caseData];

  try {
    await bot.updateModuleData("Moderation", data, guild);
  } catch (e) {
    throw new Error("Could not update data");
  }
}

export async function removeCase(bot: ExtendedClient, guild: Guild, caseID: string): Promise<void> {
  const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

  if (!data) return;

  data.cases = data.cases.filter((c) => c.id !== caseID);

  try {
    await bot.updateModuleData("Moderation", data, guild);
  } catch (e) {
    throw new Error("Could not update data");
  }
}

export async function resolveCase(bot: ExtendedClient, guild: Guild, caseID: string, moderatorID: string, reason: string): Promise<boolean> {
  const data = await bot.getModuleData("Moderation", guild.id) as moduleData;

  if (!data) return false;

  const caseToResolve = data.cases.find((c) => c.id === caseID);

  if (!caseToResolve) return false;

  caseToResolve.resolved = {
    moderatorID,
    reason
  };

  try {
    //Try to get DM channel of user and dm them
    // const dmChannel = await bot.getDMChannel(caseToResolve.userID);
    const dmChannel = await (bot.findUser(caseToResolve.userID) as User).createDM();

    if (dmChannel) {
      await dmChannel.createMessage({
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
      });
    }

    // remove punishments
    switch (caseToResolve.action) {
    case "timeout":
      caseToResolve.time = undefined;
      caseToResolve.resolved = {
        moderatorID,
        reason
      };
      guild.members.get(caseToResolve.userID)?.edit({
        communicationDisabledUntil: undefined
      });
      break;
    case "ban":
      caseToResolve.resolved = {
        moderatorID,
        reason
      };
      guild.removeBan(caseToResolve.userID, reason).catch((error) => {
        // Log the error or handle it appropriately
        console.error(`Failed to remove ban for user ${caseToResolve.userID}:`, error);
      });
      break;
    }


    await bot.updateModuleData("Moderation", data, guild);
    await updateLogEntry(bot, guild, caseToResolve);
    return true;
  } catch (e) {
    throw new Error(`Could not resolve case: ${e}`);
  }
}