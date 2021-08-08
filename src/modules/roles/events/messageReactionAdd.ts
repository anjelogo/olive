import { Emoji, Guild, Member, Message, PrivateChannel, Role } from "eris";
import Bot from "../../../main";
import Main from "../../main/main";
import Roles, { RolesMessage } from "../main";

export const run = async (bot: Bot, msg: Message, emoji: Partial<Emoji>, reactor: Partial<Member>): Promise<void> => {

	if (!msg || !emoji || !reactor || !msg.guildID) return;

	const guild: Guild = bot.findGuild(msg.guildID) as Guild,
		member: Member = bot.findMember(guild, reactor.id) as Member,
		rolesModule: Roles = bot.getModule("Roles"),
		mainModule: Main = bot.getModule("Main"),
		msgData: RolesMessage = await rolesModule.getReactionMessage(msg.id, msg.guildID) as RolesMessage;

	if (!msgData || member.bot) return;

	if (!await mainModule.handlePermission(member, "roles.reaction.interact")) return;

	const emote = emoji.id,
		rData = msgData.roles.find((r) => r.emote.id === emote);
	
	if (rData) {

		const role: Role = bot.findRole(guild, rData.role) as Role,
			dmChannel: PrivateChannel | undefined = await bot.getDMChannel(member.id);

		if (member.roles.includes(role.id)) return;

		try {
			await member.addRole(role.id);
			
			if (dmChannel) dmChannel.createMessage(`${bot.constants.emojis.tick} You have been given the role \`${role.name}\` in \`${guild.name}\`.`);
		} catch (e) {
			if (dmChannel) dmChannel.createMessage(`${bot.constants.emojis.warning.red} There was a problem while adding your role.`);
		}

	}	

};