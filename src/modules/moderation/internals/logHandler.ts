import { Constants, Guild, Member, MessageComponent, TextChannel, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging, { moduleData } from "../../logging/main";
import { Case } from "../main";

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
          content: `${["ban", "timeout"].some((a) => a === data.action) ? (data.time ? `\`${bot.constants.utils.HMS(data.time)}\`` : "Permanent") : "No Duration"}`
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

export async function updateLogEntry(bot: ExtendedClient, guild: Guild, data: Case) {

  const guildData = await bot.getModuleData("Logging", guild.id) as moduleData;

  if (guildData.channels.filter((c) => c.types.includes("moderation")).length) {
    const moderationLogChannels = guildData.channels.filter((c) => c.types.includes("moderation") && c.cases);

    if (!moderationLogChannels.length) return;

    const channelsWithCases = moderationLogChannels.filter((c) => c.cases && c.cases.find((c) => c.caseID === data.id));

    if (!channelsWithCases) return;

    const cases = channelsWithCases.map((c) => c.cases && c.cases.find((c) => c.caseID === data.id));

    if (cases.length) {
      for (const Case of cases) {
        if (!Case) continue;
        const channel = bot.getChannel(Case.channelID) as TextChannel;
        if (!channel) continue;
        const message = await channel.getMessage(Case.messageID);
        if (!message) continue;

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
                content: `${["ban", "timeout"].some((a) => a === data.action) ? (data.time ? `\`${bot.constants.utils.HMS(data.time)}\`` : "Permanent") : "No Duration"}`
              }, {
                type: Constants.ComponentTypes.SEPARATOR,
                spacing: Constants.SeparatorSpacingSize.SMALL,
                divider: false
              }, {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `### Reason:\n~~${data.resolved?.reason ?? data.reason ?? "No reason provided."}~~\n${data.resolved ? data.resolved.reason : "No resolve reason provided."}`
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
        

        await message.edit({
          components,
          flags: Constants.MessageFlags.IS_COMPONENTS_V2
        });
      }
    }

  }

}