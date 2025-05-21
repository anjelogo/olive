import { Constants, Guild, Member, Role, User } from "oceanic.js";
import uniqid from "uniqid";
import { Case, CaseActionTypes, ModerationModuleData } from "../../../Database/interfaces/ModerationModuleData";
import ExtendedClient from "../../../Base/Client";
import { addCase, getCases, resolveCase } from "./caseHandler";
import { createLogEntry } from "./logHandler";

export async function punish(bot: ExtendedClient, guild: Guild, data: Case): Promise<void> {
  const action = {
      warn: "You were warned in {guild}.",
      timeout: "You have been put on timeout in {guild}.",
      kick: "You have been kicked from {guild}.",
      ban: "You have been banned from {guild}."
    },
    moderator = bot.findMember(guild, data.moderatorID) as Member,
    user = bot.findUser(data.userID) as User,
    reason = data.reason ?? "No reason provided.";

  if (!user) {
    throw new Error(`${bot.constants.emojis.x} I can't find that user.`);
  }

  try {
    await addCase(bot, guild, data);
    if (["ban", "kick"].includes(data.action)) {
      await createLogEntry(bot, guild, data, user);
    } else {
      await createLogEntry(bot, guild, data);
    }

    // check for permissions
    const botMember = bot.findMember(guild, bot.user.id) as Member;
    if (!botMember.permissions.has("MODERATE_MEMBERS")) {
      throw new Error(`${bot.constants.emojis.x} I don't have permission to punish this user.`);
    }

    switch (data.action) {

    case "timeout": {
      const time = data.time ? new Date(data.time as string).toISOString()
          : new Date(Date.now() + 60 * 1000).toISOString(),
        member = bot.findMember(guild, user.id) as Member;

      await member.edit({
        communicationDisabledUntil: time
      });
      break;
    }
    case "ban":
      await guild.createBan(user.id, { reason: reason });
      break;
    case "kick":
      await guild.removeMember(user.id, reason);
      break;
    }


    const dmChannel = await user.createDM();
    if (dmChannel) {
      dmChannel.createMessage({
        components: [
          {
            type: Constants.ComponentTypes.CONTAINER,
            components: [
              {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: `## ${action[data.action].replace("{guild}", guild.name)}`,
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
                content: "### Reason:\n" + reason
              }
            ]
          }
        ],
        flags: Constants.MessageFlags.IS_COMPONENTS_V2
      }).catch(() => {
        // ignore error
      });
    }
  

  } catch (e) {
    throw new Error(e as string);
  }

}

export async function autoCalculateInfractions(bot: ExtendedClient, guildID: string, user: User): Promise<void> {

  const guild = bot.guilds.get(guildID) as Guild;

  if (!guild) {
    throw new Error(`${bot.constants.emojis.x} I can't find that server.`);
  }
  
  const history = (await getCases(bot, guild, user.id)).filter(c => !c.resolved),
    guildSettings = await bot.getModuleData("Moderation", guild.id) as ModerationModuleData,
    hierarchy = {
      warn: 1,
      timeout: 3,
      kick: 6,
      ban: 12
    };
	
  let punishment: CaseActionTypes | undefined,
    reason,
    infractions = 0;

  history.sort((a, b) => {
    if (a.timestamp > b.timestamp) return 1;
    if (a.timestamp < b.timestamp) return -1;
    return 0;
  });

  if (history.filter(c => c.action === "ban").length) return;
    
  for (const Case of history) infractions += hierarchy[Case.action];

  if (infractions < guildSettings.settings.infractionUntilTimeout) return;
  else if (infractions >= guildSettings.settings.infractionUntilTimeout && infractions < guildSettings.settings.infractionUntilKick) punishment = "timeout";
  else if (infractions >= guildSettings.settings.infractionUntilKick && infractions < guildSettings.settings.infractionUntilBan) punishment = "kick";
  else if (infractions >= guildSettings.settings.infractionUntilBan) punishment = "ban";

  if (!punishment) return;

  // handle punishment case resolves
  // do math and check the last few cases and resolve them if their infractions equal the punishment
  // for instance if 3 warns = 1 timeout, resolve all warns and give timeout
  // another example is 2 warn and 2 timeout = 1 kick, resolve the warns and timeouts and give kick
  // another example is 3 warn and 1 timeout = 1 kick, resolve the warns and the timeout give kick

  for (const Case of history) {
    if (Case.action === punishment) return;

    const thresholds = {
      warn: guildSettings.settings.infractionUntilTimeout,
      timeout: guildSettings.settings.infractionUntilTimeout,
      kick: guildSettings.settings.infractionUntilKick,
      ban: guildSettings.settings.infractionUntilBan
    };

    if (infractions >= thresholds[punishment]) {
      reason = `[**AUTO-MOD**] ${Case.action.toUpperCase()} removed for ${punishment.toUpperCase()}.`;
      await resolveCase(bot, guild, Case.id, bot.user.id, reason);
    }
  }

  reason = `[**AUTO-MOD**] ${punishment.toUpperCase()} for ${infractions} infractions.`;

  await punish(bot, guild, {
    id: uniqid(),
    userID: user.id,
    moderatorID: bot.user.id,
    action: punishment,
    reason,
    timestamp: new Date().toISOString(),
  });
}

export async function isPunishable(bot: ExtendedClient, moderator: Member, userToPunish: Member): Promise<boolean> {
  const botMember = bot.findMember(moderator.guild, bot.user.id) as Member,
    botHighestRoleID = botMember.roles
      .map((r) => 
        ({
          name: (bot.findRole(moderator.guild, r) as Role).name,
          position: (bot.findRole(moderator.guild, r) as Role).position
        }))
      .sort((a, b) => b.position - a.position).map((r) => r.name),
    botHighestRole = bot.findRole(moderator.guild, botHighestRoleID[0]) as Role,
    memberHighestRoleID = moderator.roles.length
      ? moderator.roles
        .map((r) => 
          ({
            name: (bot.findRole(moderator.guild, r) as Role).name,
            position: (bot.findRole(moderator.guild, r) as Role).position
          }))
        .sort((a, b) => b.position - a.position).map((r) => r.name)
      : [moderator.guild.id],
    memberHighestRole = bot.findRole(moderator.guild, memberHighestRoleID[0]) as Role,
    userToPunishHighestRoleID = userToPunish.roles.length
      ? userToPunish.roles
        .map((r) => 
          ({
            name: (bot.findRole(moderator.guild, r) as Role).name,
            position: (bot.findRole(moderator.guild, r) as Role).position
          }))
        .sort((a, b) => b.position - a.position).map((r) => r.name)
      : [moderator.guild.id],
    userToPunishHighestRole = bot.findRole(moderator.guild, userToPunishHighestRoleID[0]) as Role;

  if (moderator.guild.ownerID == userToPunish.id)
    return false;
  if (userToPunish.id === moderator.id)
    return false;
  if (userToPunish.id === moderator.guild.ownerID)
    return false;
  if (userToPunishHighestRole.position > memberHighestRole.position)
    return false;
  if (userToPunishHighestRole.position === memberHighestRole.position)
    return false;
  if (userToPunishHighestRole.position > botHighestRole.position)
    return false;
  if (userToPunishHighestRole.position === botHighestRole.position)
    return false;

  return true;
}