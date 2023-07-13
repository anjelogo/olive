import { Guild, Member, User } from "oceanic.js";
import ExtendedClient from "../../../Base/Client";
import Logging from "../main";

export const run = async (bot: ExtendedClient, guild: Guild, member: Member | { id: string; user: User }): Promise<void> => {

	const logging = await bot.getModule("Logging") as Logging;

	const user = member.user;

	logging.log(guild, "welcome", {embeds: [{
		type: "rich",
		title: `${user.username}#${user.discriminator}`,
		description: "Left the server",
		author: {
			name: "Left Server",
			iconURL: member.user.avatarURL()
		},
		color: bot.constants.config.colors.green,
		timestamp: new Date().toDateString(),
		footer: {
			text: `ID: ${member.id}`
		}
	}]});

};