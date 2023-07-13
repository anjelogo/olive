import { Channel, Emoji, Guild, Member, Message, TextChannel } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { handleStarredMessage } from "../internals/starHandler";

export const run = async (bot: ExtendedClient, msgObj: (Message | { id: string; channel: Channel; author?: unknown; guildID?: unknown }), emoji: Partial<Emoji>, reactor: Partial<Member>) => {
	if (emoji.name !== "⭐") return;

	let msg: Message;

	if (!msgObj.author) msg = bot.findMessage(bot.getChannel((msgObj.channel as Channel).id) as TextChannel, msgObj.id) as Message;
	else msg = msgObj as Message;

	if (!msg || !emoji || !reactor || !msg.guildID) return;

	const guild = bot.findGuild(msg.guildID) as Guild,
		member = bot.findMember(guild, reactor.id) as Member;

	if (member.bot) return;
    
	await handleStarredMessage(bot, guild, msg, "add", reactor.id as string);
};