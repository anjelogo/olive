import { Guild, Member, TextChannel, Message } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { ModmailModuleData } from "../../../Database/interfaces/ModmailModuleData";
import { relayContent } from "../internals/ticketHandler";

const relayToTickets = async (bot: ExtendedClient, msg: Message, content: string): Promise<void> => {
	const allData = await bot.getAllData("Modmail") as ModmailModuleData[];

	for (const data of allData) {
		const ticket = data.openTickets.find((t) => t.memberID === msg.author.id);
		if (!ticket) continue;

		const guild = bot.findGuild(data.guildID);
		if (!guild) continue;

		const channel = bot.findChannel(guild, ticket.channelID) as TextChannel;
		if (!channel) continue;

		await channel.createMessage({
			embeds: [{
				author: { name: msg.author.tag, iconURL: msg.author.avatarURL() },
				description: content,
				color: bot.constants.config.colors.default,
				timestamp: new Date().toISOString()
			}]
		});
	}
};

const relayToMember = async (bot: ExtendedClient, msg: Message, content: string): Promise<void> => {
	const data = await bot.getModuleData("Modmail", { guildID: msg.guildID as string }) as ModmailModuleData | undefined;
	if (!data) return;

	const ticket = data.openTickets.find((t) => t.channelID === msg.channelID);
	if (!ticket) return;

	const guild = bot.findGuild(msg.guildID) as Guild,
		member = bot.findMember(guild, ticket.memberID) as Member;

	if (!member) return;

	try {
		const dm = await member.user.createDM();
		await dm.createMessage({
			embeds: [{
				author: { name: msg.member?.nick ?? msg.author.username, iconURL: msg.author.avatarURL() },
				description: content,
				color: bot.constants.config.colors.default,
				timestamp: new Date().toISOString()
			}]
		});
	} catch (e) {
		console.error(e);
	}
};

export const run = async (bot: ExtendedClient, msg: Message): Promise<void> => {
	if (msg.author.bot) return;

	const content = relayContent(msg);
	if (!content) return;

	if (msg.guildID) await relayToMember(bot, msg, content);
	else await relayToTickets(bot, msg, content);
};
