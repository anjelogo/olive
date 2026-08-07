import { TextChannel, Message } from "oceanic.js";
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

export const run = async (bot: ExtendedClient, msg: Message): Promise<void> => {
	if (msg.author.bot) return;
	if (msg.guildID) return;

	const content = relayContent(msg);
	if (!content) return;

	await relayToTickets(bot, msg, content);
};
