import { Guild, Member, PartialEmoji, PossiblyUncachedMessage, PrivateChannel, Role, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Main from "../../main/main";
import Roles, { RolesMessage } from "../main";

export const run = async (bot: ExtendedClient, msg: PossiblyUncachedMessage, reactor: Uncached | Member | User, emoji: PartialEmoji): Promise<void> => {
	if (!msg || !emoji || !reactor || !msg.guildID || !msg.id) return;

	const guild: Guild = bot.findGuild(msg.guildID) as Guild,
		rolesModule: Roles = bot.getModule("Roles"),
		mainModule: Main = bot.getModule("Main"),
		msgData: RolesMessage = await rolesModule.getReactionMessage(msg.id, msg.guildID) as RolesMessage,
		member = guild.members.get(reactor.id);

	if (!member || !msgData || member.bot) return;

	if (!await mainModule.handlePermission(member, "roles.reaction.interact")) return;

	const emote = emoji.id,
		rData = msgData.roles.find((r) => r.emote.id === emote);
	
	if (rData) {

		const role: Role = bot.findRole(guild, rData.role) as Role,
			dmChannel: PrivateChannel | undefined = await member.user.createDM();

		if (!member.roles.includes(role.id)) return;

		try {
			await member.removeRole(role.id);
			
			if (dmChannel) dmChannel.createMessage({content: `${bot.constants.emojis.tick} You have removed the role \`${role.name}\` in \`${guild.name}\`.`});
		} catch (e) {
			if (dmChannel) dmChannel.createMessage({content: `${bot.constants.emojis.warning.red} There was a problem while removing your role.`});
		}

	}

};