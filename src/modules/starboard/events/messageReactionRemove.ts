import { Emoji, Guild, Member, Message } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import { handleStarredMessage } from "../internals/starHandler";

export const run = async (bot: ExtendedClient, msg: Message, emoji: Partial<Emoji>, userID: string) => {
	if (emoji.name !== "⭐") return;

	if (!msg || !emoji || !userID || !msg.guildID) return;

	const guild = bot.findGuild(msg.guildID) as Guild,
		member = bot.findMember(guild, userID) as Member;

	if (member.bot) return;

	await handleStarredMessage(bot, guild, msg, "remove", userID);
};