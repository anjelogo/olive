import { Guild, Member, Uncached, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, member: Member | User, guild: Guild | Uncached): Promise<void> => {

	const logging = await bot.getModule("Logging") as Logging;

	const user = member instanceof User ? member : member.user;

	logging.log(bot.findGuild(guild.id) as Guild, "welcome", {embeds: [{
		type: "rich",
		title: `${user.username}`,
		description: "Left the server",
		author: {
			name: "Left Server",
			iconURL: user.avatarURL()
		},
		color: bot.constants.config.colors.green,
		timestamp: new Date().toDateString(),
		footer: {
			text: `ID: ${member.id}`
		}
	}]});

};