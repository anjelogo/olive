import { Embed, Guild, Member, Role, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { Case, CaseActionTypes, moduleData } from "../main";
import { addCase, getCases, resolveCase } from "./caseHandler";
import uniqid from "uniqid";
import { createLogEntry } from "./logHandler";

export async function punish(bot: ExtendedClient, guild: Guild, data: Case): Promise<void> {
	const action = {
			warn: "You were warned in {guild}.",
			timeout: "You have been put on timeout in {guild}.",
			kick: "You have been kicked from {guild}.",
			ban: "You have been banned from {guild}."
		},
		moderator = bot.findMember(guild, data.moderatorID) as Member,
		dmChannel = await bot.findUser(data.userID)?.createDM(),
		member = bot.findMember(guild, data.userID) as Member,
		reason = data.reason ?? "No reason provided.",
		embed: Embed = {
			type: "rich",
			title: action[data.action].replace("{guild}", guild.name),
			fields: [
				{
					name: "Moderator",
					value: moderator.mention,
					inline: true
				}, {
					name: "Punishment Duration",
					value: data.time ? `\`${bot.constants.utils.HMS(data.time)}\`` : "Permanent",
					inline: true
				}, {
					name: "Reason",
					value: reason
				}
			],
			footer: {
				text: `Case ID: ${data.id}`
			},
			timestamp: new Date().toISOString(),
			color: bot.constants.config.colors.default
		};

	try {
		await addCase(bot, guild, data);
		await createLogEntry(bot, guild, data);

		switch (data.action) {

		case "warn":
			dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
			break;
		case "timeout":
			dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;

      const time = data.time ? new Date(data.time as string).toISOString()
                             : new Date(Date.now() + 60 * 1000).toISOString();

			member.edit({
				communicationDisabledUntil: time
			});
			break;
		case "ban":
			dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
			guild.createBan(data.userID, { reason: reason });
			break;
		case "kick":
			dmChannel ? await dmChannel.createMessage({embeds: [embed]}) : null;
			guild.removeMember(data.userID, reason);
			break;
		}

	} catch (e) {
		throw new Error(e as string);
	}

}

export async function autoCalculateInfractions(bot: ExtendedClient, member: Member): Promise<void> {
	const history = await getCases(bot, member.guild, member.id),
		guildSettings = await bot.getModuleData("Moderation", member.guild.id) as moduleData,
		hierarchy = {
			warn: 1,
			timeout: 2,
			kick: 2,
			ban: 3
		};
	
	let punishment: CaseActionTypes | undefined,
		reason,
		infractions = 0;

	if (history.filter(c => c.action === "ban").length) return;
    
	for (const Case of history) infractions += hierarchy[Case.action];

	if (infractions < guildSettings.settings.infractionUntilTimeout) return;
	if (infractions >= guildSettings.settings.infractionUntilTimeout && infractions < guildSettings.settings.infractionUntilBan) punishment = "timeout";
	else if (infractions >= guildSettings.settings.infractionUntilBan) punishment = "ban";

	if (!punishment) return;

	if (history.filter((c) => c.action === "timeout" && !c.resolved).length) {
		switch (punishment) {
		case "ban":
			await resolveCase(bot, member.guild, history.filter((c) => c.action === "timeout" && !c.resolved)[0].id, member.id, "[**AUTO-MOD**] Timeout removed for ban.");
			break;
		}
	}

	await punish(bot, member.guild, {
		id: uniqid(),
		userID: member.id,
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
    return false
  if (userToPunish.id === moderator.id)
    return false
  if (userToPunish.id === moderator.guild.ownerID)
    return false
  if (userToPunishHighestRole.position > memberHighestRole.position)
    return false
  if (userToPunishHighestRole.position === memberHighestRole.position)
    return false
  if (userToPunishHighestRole.position > botHighestRole.position)
    return false
  if (userToPunishHighestRole.position === botHighestRole.position)
    return false

  return true;
}