import { CategoryChannel, Constants, Guild, Member, Message, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { ModmailModuleData, Ticket } from "../../../Database/interfaces/ModmailModuleData";

export const relayContent = (msg: Message): string | undefined => {
	const parts: string[] = [];

	if (msg.content) parts.push(msg.content);
	if (msg.attachments.size) parts.push(msg.attachments.map((a) => a.url).join("\n"));

	return parts.length ? parts.join("\n") : undefined;
};

export const createTicket = async (bot: ExtendedClient, guild: Guild, member: Member, data: ModmailModuleData): Promise<TextChannel> => {
	const categoryOverwrites = (bot.findChannel(guild, data.categoryID) as CategoryChannel).permissionOverwrites.map((p) => ({ id: p.id, type: p.type, allow: p.allow, deny: p.deny }));

	const channel = await guild.createChannel(Constants.ChannelTypes.GUILD_TEXT, {
		name: `ticket-${member.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 100),
		parentID: data.categoryID,
		// staff-only channel: opening member never gets a permission overwrite, all
		// member-side communication happens over DM (see relayContent/messageCreate)
		permissionOverwrites: [...categoryOverwrites]
	}) as TextChannel;

	const ticket: Ticket = { channelID: channel.id, memberID: member.id, createdAt: Date.now() };

	await bot.updateModuleData("Modmail", { openTickets: [...data.openTickets, ticket] }, { guildID: guild.id });

	await channel.createMessage({
		embeds: [{
			description: `Ticket opened by <@${member.id}>. Plain messages sent here relay to their DMs; use \`/modmail note\` for internal-only comments.`,
			color: bot.constants.config.colors.default
		}]
	});

	return channel;
};

export const closeTicket = async (bot: ExtendedClient, guild: Guild, channel: TextChannel, ticket: Ticket, closedBy: Member, data: ModmailModuleData): Promise<void> => {
	const history = (await channel.getMessages({ limit: 100 })).reverse(),
		lines = history.map((m) => `[${new Date(m.createdAt).toISOString()}] ${m.author.tag}: ${m.content}${m.attachments.size ? `\n${m.attachments.map((a) => a.url).join("\n")}` : ""}`),
		transcript = Buffer.from(lines.join("\n"), "utf-8");

	const logChannel = bot.findChannel(guild, data.logChannelID) as TextChannel | undefined;

	if (logChannel) {
		await logChannel.createMessage({
			embeds: [{
				author: { name: closedBy.tag, iconURL: closedBy.avatarURL() },
				description: `Closed ticket for <@${ticket.memberID}> in \`${channel.name}\``,
				color: bot.constants.config.colors.red,
				timestamp: new Date().toISOString()
			}],
			files: [{ name: `${channel.name}.txt`, contents: transcript }]
		});
	}

	await channel.edit({ name: `closed-${channel.name}`.slice(0, 100) });

	await bot.updateModuleData("Modmail", { openTickets: data.openTickets.filter((t) => t.channelID !== ticket.channelID) }, { guildID: guild.id });
};
