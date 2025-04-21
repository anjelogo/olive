import { Channel, PartialEmoji, Guild, Member, Message, PossiblyUncachedMessage, TextChannel, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { handleStarredMessage } from "../internals/starHandler";

export const run = async (bot: ExtendedClient, msgObj: PossiblyUncachedMessage | Message, reactor: Uncached | Member | User, emoji: PartialEmoji) => {
	if (emoji.name !== "⭐") return;

	let msg: Message;

	if (!(msgObj instanceof Message)) msg = bot.findMessage(bot.getChannel((msgObj.channel as Channel).id) as TextChannel, msgObj.id) as Message;
	else msg = msgObj as Message;

	if (!msg || !emoji || !reactor || !msg.guildID) return;

	const guild = bot.findGuild(msg.guildID) as Guild,
		member = bot.findMember(guild, reactor.id) as Member;

	if (member.bot) return;
    
	await handleStarredMessage(bot, guild, msg, "add", reactor.id as string);
};