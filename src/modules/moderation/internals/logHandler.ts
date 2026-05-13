import { Constants, Guild, Member, MessageComponent, User } from "oceanic.js";

import ExtendedClient from "../../../Base/Client";
import Logging from "../../logging/main";
import { LoggingModuleData } from "../../../Database/interfaces/LoggingModuleData";
import { Case } from "../../../Database/interfaces/ModerationModuleData";
import { prettifyDuration } from "./durationHandler";

export async function createLogEntry(bot: ExtendedClient, guild: Guild, data: Case, partialUser?: Partial<User>) {

  const actions = {
      warn: "Warned",
      kick: "Kicked",
      ban: "Banned",
      timeout: "Timed Out"
    },
    logging = bot.getModule("Logging") as Logging,
    member = partialUser ?? bot.findMember(guild, data.userID) as Member,
    moderator = bot.findMember(guild, data.moderatorID) as Member,
    components: MessageComponent[] = [{
      type: Constants.ComponentTypes.CONTAINER,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `## User <@${member.id}> ${actions[data.action]}`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "### Moderator:",
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `<@${moderator.id}> (${moderator.id})`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "### Punishment Duration:"
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${["ban", "timeout"].some((a) => a === data.action) ? (data.duration ? `\`${prettifyDuration(data.duration)}\`` : "Permanent") : "No Duration"}`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `### Reason:\n${data.reason ?? "No reason provided."}`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          divider: true,
          spacing: Constants.SeparatorSpacingSize.LARGE
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${bot.constants.emojis.administrator} <t:${Math.floor(Date.now() / 1000)}:f> • ||Case: ${data.id}||`
        }
      ],
      accentColor: bot.constants.config.colors.red
    }];
    

  logging.log(guild, "moderation", components, { caseID: data.id });
}

// serialize edits per channel — prevents concurrent calls from racing on the same channel
const editQueue = new Map<string, Promise<void>>();

function enqueue(channelID: string, fn: () => Promise<void>): void {
  const prev = editQueue.get(channelID) ?? Promise.resolve();
  const next = prev.then(fn, () => {}).finally(() => {
    if (editQueue.get(channelID) === next) editQueue.delete(channelID);
  });
  editQueue.set(channelID, next);
}

export async function updateLogEntry(bot: ExtendedClient, guild: Guild, data: Case) {
  const guildData = await bot.getModuleData("Logging", { guildID: guild.id }) as LoggingModuleData;
  if (!guildData?.channels) return;

  const moderationLogChannels = guildData.channels.filter(
    (c) => c.types.includes("moderation") && c.cases?.some((c) => c.caseID === data.id)
  );
  if (!moderationLogChannels.length) return;

  const originalModerator = bot.findMember(guild, data.moderatorID) as Member,
    resolvedModerator = bot.findMember(guild, data.resolved?.moderatorID) as Member,
    components: MessageComponent[] = [{
      type: Constants.ComponentTypes.CONTAINER,
      components: [
        {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `## User <@${data.userID}> ${data.resolved ? "Case Resolved" : "Case Updated"}`,
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "### Moderator:",
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `~~<@${originalModerator.id}>~~ <@${resolvedModerator.id}>`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: "### Punishment Duration:"
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${["ban", "timeout"].some((a) => a === data.action) ? (data.duration ? `\`${prettifyDuration(data.duration)}\`` : "Permanent") : "No Duration"}`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          spacing: Constants.SeparatorSpacingSize.SMALL,
          divider: false
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `### Reason:\n~~${data.reason ?? "No reason provided."}~~\n${data.resolved ? data.resolved.reason : "No resolve reason provided."}`
        }, {
          type: Constants.ComponentTypes.SEPARATOR,
          divider: true,
          spacing: Constants.SeparatorSpacingSize.LARGE
        }, {
          type: Constants.ComponentTypes.TEXT_DISPLAY,
          content: `${bot.constants.emojis.administrator} <t:${Math.floor(Date.now() / 1000)}:f> • ||Case: ${data.id}||`
        }
      ],
      accentColor: bot.constants.config.colors.green
    }];

  for (const logChannel of moderationLogChannels) {
    const caseEntry = logChannel.cases?.find((c) => c.caseID === data.id);
    if (!caseEntry) continue;
    if (caseEntry.broken) continue; // V4: skip channels marked broken

    enqueue(caseEntry.channelID, async () => {
      try {
        // V1: REST PATCH — no cache dependency
        await bot.rest.channels.editMessage(caseEntry.channelID, caseEntry.messageID, {
          components,
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });
        // V5: track last successful edit
        caseEntry.lastSeen = new Date().toISOString();
        await bot.updateModuleData("Logging", guildData, { guildID: guild.id });
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;

        if (status === 404) {
          // V2: message gone — resend and store new messageID
          try {
            const newMsg = await bot.rest.channels.createMessage(caseEntry.channelID, {
              components,
              flags: Constants.MessageFlags.IS_COMPONENTS_V2
            });
            caseEntry.messageID = newMsg.id;
            caseEntry.lastSeen = new Date().toISOString();
            await bot.updateModuleData("Logging", guildData, { guildID: guild.id });
          } catch {
            // resend failed too — leave entry unchanged
          }
        } else if (status === 403) {
          // V3: no perms — mark broken, stop future attempts on this channel
          caseEntry.broken = true;
          await bot.updateModuleData("Logging", guildData, { guildID: guild.id });
        }
        // 429: Oceanic REST manager handles rate limits internally
      }
    });
  }
}